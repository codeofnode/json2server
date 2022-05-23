module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function isObject(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  var http2 = require('http2'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    urlp = require('url');

  function func(options, cb) {
    // mo = multipart object, ca = ca file path for http2 connect option
    var url, method, payload, headers, parser, mo, caFile, http2Options;
    if (typeof cb !== 'function') {
      cb = function() {};
    }
    if (typeof options === 'string') {
      url = options;
      parser = JSON.parse;
    } else if (isObject(options)) {
      url = options.url;
      method = options.method;
      payload = typeof options.body === 'undefined' ? options.payload : options.body;
      http2Options = (options.http2Options === true || isObject(options.http2Options)) ? options.http2Options : undefined;
      headers = options.headers;
      parser = typeof options.parser === 'function' ? options.parser : JSON.parse;
      caFile = typeof options.caFile === 'string' ? fs.readFileSync(options.caFile) : undefined;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if (typeof url !== 'string' || !url.length) {
      return cb('URL_NOT_FOUND');
    }
    if (typeof method !== 'string' || !method.length) {
      method = 'GET';
    }
    var contFound = false, contLenFound = false, obj = urlp.parse(url), client;
    obj.method = method;
    if(typeof headers !== 'object' || headers === null){
      headers = {};
    }
    for(var key in headers){
      if(key.toLowerCase() === http2.constants.HTTP2_HEADER_CONTENT_TYPE){
        contFound = true;
        if (contLenFound) break;
      }
      if(key.toLowerCase() === http2.constants.HTTP2_HEADER_CONTENT_LENGTH){
        contLenFound = true;
        if (contFound) break;
      }
    }
    obj.headers = headers;
    if (http2) {
      client = http2.connect(obj.protocol+"//"+obj.host, { ca: caFile });
      client.on('error', function(er) { cb({parseError: er}) });
    }
    function uponResponse(res) {
      var resc = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        resc += chunk;
      });
      var capturedHeaders, capturedStatusCode;
      function capture(headers){
          capturedHeaders = headers;
          capturedStatusCode = headers[http2.constants.HTTP2_HEADER_STATUS];
      }
      function respond(headers, flags){
        if (http2) client.close();
        var toSend = {
          statusCode: http2 ? capturedStatusCode : res.statusCode,
          headers : http2 ? capturedHeaders : res.headers,
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
      if (http2) {
        res.on('response', capture);
      } else {
        res.on('error', respond);
      }
      res.on('end', respond);
    }
    if (payload !== undefined) {
      payload = GLOBAL_METHODS.stringify(payload);
      if (!contFound){
        headers[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = 'application/json';
      }
      if (!contLenFound) {
        headers[http2.constants.HTTP2_HEADER_CONTENT_LENGTH] = Buffer.byteLength(payload);
      }
    } else if (options.payloadStream instanceof fs.ReadStream) {
      mo = (isObject(options.multipartOptions) ? options.multipartOptions : {});
      if (!(mo.boundaryKey)) {
        mo.boundaryKey = Math.random().toString(16).substr(2, 11);
      }
      headers[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = 'multipart/form-data; boundary="----'+mo.boundaryKey+'"';
      if (mo.contentLength) {
        headers[http2.constants.HTTP2_HEADER_CONTENT_LENGTH] = mo.contentLength;
      }
    }
    Object.assign(headers, {
        [http2.constants.HTTP2_HEADER_SCHEME]: obj.protocol.slice(0, -1),
        [http2.constants.HTTP2_HEADER_METHOD]: obj.method,
        [http2.constants.HTTP2_HEADER_PATH]: obj.pathname,
    });
    var req;
    if (http2) {
      req = client.request(headers);
      uponResponse(req);
    } else {
      req = (obj.protocol === 'https:' ? https : http).request(obj, uponResponse);
      for (var hdrKey in headers) {
        req.setHeader(hdrKey, headers[hdrKey]);
      }
    }
    req.once('error',function(er){
      return cb('ERROR_WHILE_REQUEST:'+(er.message||er));
    });
    if (mo !== undefined) {
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
    } else if (payload !== undefined) {
      req.end(Buffer.from(payload));
    } else {
      req.end();
    }
    return req;
  }

  return func;
};
