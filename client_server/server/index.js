
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function server(inputHandler, httpsConfig){
    function handler(req,res){
      req.parsedUrl = require('url').parse(req.url);
      inputHandler(req,res);
    }
    var isHttps = typeof httpsConfig === 'object' && httpsConfig,
      mod = isHttps ? require('https') : require("http"),
      port =  GLOBAL_APP_CONFIG.port || 3000;

    var server = isHttps ? mod.createServer(httpsConfig, handler) : mod.createServer(handler);
    server.listen(parseInt(port, 10));

    console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
  };

  return server;
}
