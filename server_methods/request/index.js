module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function isObject(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  var http = require('http'),
    https = require('https'),
    fs = require('fs'),
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
    } else if (isObject(options)) {
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
    if(typeof headers !== 'object' || headers === null){
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
          content: resc
        };
        if (typeof parser === 'function') {
          try {
            toSend.parsed = parser(resc);
          } catch (er) {
            toSend.parseError = er;
          }
        }
        if (typeof toSend.statusCode === 'number' && Math.floor((toSend.statusCode / 100)) === 2) {
          cb(null, toSend);
        } else {
          cb(toSend);
        }
      }
      res.on('error', respond);
      res.on('end', respond);
    });
    req.once('error',function(er){
      return cb('ERROR_WHILE_REQUEST:'+(er.message||er));
    });
    if (payload !== undefined) {
      payload = GLOBAL_METHODS.stringify(payload);
      req.end(payload);
    } else if (options.payloadStream instanceof fs.ReadStream) {
      var mo = (isObject(options.multipartOptions) ? options.multipartOptions : {});
      if (!(mo.boundaryKey)) {
        mo.boundaryKey = Math.random().toString(16).substr(2, 11);
      }
      req.setHeader('content-type', 'multipart/form-data; boundary="----'+mo.boundaryKey+'"');
      if (mo.contentLength) {
        req.setHeader('Content-Length', mo.contentLength);
      }
      if (isObject(mo.formData)) {
        Object.keys(mo.formData).forEach(function(formKey) {
          var formValue = mo.formData[formKey];
          req.write('------'+mo.boundaryKey+'\r\nContent-Disposition: form-data; name="'+formKey+'"\r\n\r\n'+formValue+'\r\n');
        });
      }
      req.write('------'+mo.boundaryKey+'\r\nContent-Type: '+(mo.mimeType || 'application/octet-stream')+'\r\nContent-Disposition: form-data; name="'+(mo.fieldName || 'file1')+'"; filename="'+(mo.fileName || 'filename')+'"\r\n\r\n');
      options.payloadStream.pipe(req, { end: false });
      options.payloadStream.once('end', req.end.bind(req, '\r\n------'+mo.boundaryKey+'--\r\n'));
      options.payloadStream.once('error', function(er){
        return cb('ERROR_WITH_FILE_STREAM:'+(er.message||er));
      });
    } else {
      req.end();
    }
    return req;
  }

  return func;
};
