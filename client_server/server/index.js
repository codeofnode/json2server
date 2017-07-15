
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function server(inputHandler, httpsConfig, GLOBAL_API){
    function handler(req,res){
      req.parsedUrl = require('url').parse(req.url,true);
      inputHandler(req,res);
    }
    if(GLOBAL_APP_CONFIG.url){
      var url = GLOBAL_APP_CONFIG.url, method = 'GET', mind = url.indexOf('@/');
      if(mind > 2 && mind < 10){
        method = url.substring(0, mind);
        url = url.substring(mind+1);
      }
      var req = new (require('events'))();
      req.method = method;
      req.url = url;
      var HTTP = require('http');
      var resp = new HTTP.ServerResponse(req);
      var _end = resp.end.bind(resp);
      resp.end = function(content){
        console.log(method + ' => ' + url);
        console.log('Status : '+resp.statusCode+' ('+HTTP.STATUS_CODES[resp.statusCode]+')' + '\n');
        console.log('Headers : \n'+GLOBAL_METHODS.stringify(resp.getHeaders()) + '\n');
        console.log('Content : \n'+GLOBAL_METHODS.stringify(content));
        _end.apply(this,arguments);
        process.exit((resp.statusCode > 199 && resp.statusCode < 400) ? 0 : 1);
      };
      handler(req,resp);
      if(method !== 'GET') req.emit('end');
    } else {
      var isHttps = typeof httpsConfig === 'object' && httpsConfig,
        mod = isHttps ? require('https') : require("http"),
        port =  process.env.PORT || GLOBAL_APP_CONFIG.port || 3000;

      var server = isHttps ? mod.createServer(httpsConfig, handler) : mod.createServer(handler);
      server.listen(parseInt(port, 10),function(){
        var onReady = GLOBAL_METHODS.lastValue(GLOBAL_API, 'root', '_methods', 'onReady');
        if(typeof onReady === 'function'){ onReady(); }
      });

      console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
    }
  };

  return server;
}
