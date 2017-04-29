module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function isObect(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  const http = require('http'),
    urlp = require('url');

  function func(options, cb) {
    var url, method, payload, headers, toParse;
    if (typeof cb !== 'function') {
      cb = function() {};
    }
    if (typeof options === 'string') {
      url = options;
      method = 'GET';
      toParse = JSON.parse;
    } else if (isObect(options)) {
      url = options.url;
      method = options.method;
      payload = options.payload;
      headers = options.headers;
      toParse = options.toParse;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if (typeof url !== 'string' || !url.length) {
      return cb('URL_NOT_FOUND');
    }
    if (typeof method !== 'string' || !method.length) {
      return cb('METHOD_NOT_FOUND');
    }
    var obj = urlp.parse(url);
    obj.method = method;
    obj.headers = headers;
    var req = http.request(obj, function(res) {
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
        if (typeof toParse === 'function') {
          try {
            toSend.parsed = toParse(resc);
          } catch (er) {
            toSend.parseError = er;
          }
        }
        cb(null, toSend);
      }
      res.on('error', respond);
      res.on('end', respond);
    });
    if (typeof payload !== undefined) {
      payload = GLOBAL_METHODS.stringify(payload);
      req.write(payload);
    }
  }

  return func;
};
