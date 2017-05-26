module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function isObect(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  const http = require('http'),
    https = require('https'),
    urlp = require('url');

  function func(options, cb) {
    var url, method, payload, headers, parser;
    if (typeof cb !== 'function') {
      cb = function() {};
    }
    if (typeof options === 'string') {
      url = options;
      method = 'GET';
      parser = JSON.parse;
    } else if (isObect(options)) {
      url = options.url;
      method = options.method;
      payload = options.payload;
      headers = options.headers;
      parser = typeof options.parser === 'function' ? options.parser : JSON.parse;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if (typeof url !== 'string' || !url.length) {
      return cb('URL_NOT_FOUND');
    }
    if (typeof method !== 'string' || !method.length) {
      return cb('METHOD_NOT_FOUND');
    }
    var contFound = false,obj = urlp.parse(url);
    obj.method = method;
    if(typeof headers !== 'object' || header === null){
      headers = {};
    }
    for(var key in headers){
      if(key.toLowerCase() === 'content-type'){
        contFound = true;
        break;
      }
    }
    if(!contFound){
      headers['content-type'] = 'application/json';
    }
    obj.headers = headers;
    var req = (obj.protocol === 'https:' ? https : http).request(obj, function(res) {
      var resc = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        resc += chunk;
      });
      function respond(){
        var toSend = {
          statusCode: res.statusCode,
          headers : res.headers,
          content: resc,
        };
        if (typeof parser === 'function') {
          try {
            toSend.parsed = parser(resc);
          } catch (er) {
            toSend.parseError = er;
          }
        }
        cb(null, toSend);
      }
      res.on('error', respond);
      res.on('end', respond);
    });
    if (payload !== undefined) {
      payload = GLOBAL_METHODS.stringify(payload);
      req.write(payload);
    }
    req.once('error',function(er){
      return cb('ERROR_WHILE_REQUEST:'+(er.message||er));
    });
    req.end();
  }

  return func;
};
