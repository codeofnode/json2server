module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function isObject(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  var http2 = require('http2'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    urlp = require('url');

  function func(options, callback) {
    // mo = multipart object, ca = ca file path for http2 connect option
    var url, method, cbCalled, payload, headers, parser, mo, caFile, http2Options;
    if (typeof callback !== 'function') {
      callback = function() {};
    }
    var debugVal = Number(GLOBAL_APP_CONFIG.requestResponse && GLOBAL_APP_CONFIG.requestResponse.debug);
    function cb(error, returnObj) {
      if (cbCalled) return;
      cbCalled = true;
      var errMsg = error instanceof Error ? (String(returnObj)+": "+error.message) : error;
      if (debugVal) {
        console.log('RES: '+(error ? 'ERROR': 'SUCCESS'), (errMsg || (returnObj && returnObj.statusCode)));
        if (debugVal > 1) {
            console.log(error);
            console.log(returnObj);
        }
      }
      return callback(errMsg, returnObj);
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
    obj.timeout = options.timeout || 300000;
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
    if (http2Options) {
      client = http2.connect(obj.protocol+"//"+obj.host, { ca: caFile });
      client.once('error', function(er) { cb(er, "HTTP2_CLIENT_ERR"); });
    } else {
      obj.ca = caFile;
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
        if (http2Options && http2Options.closeClient !== false) client.close();
        var toSend = {
          statusCode: http2Options ? capturedStatusCode : res.statusCode,
          headers : http2Options ? capturedHeaders : res.headers,
          content: resc
        };
        if (typeof parser === 'function') {
          try {
            if (parser !== JSON.parse || (toSend.headers &&
                (String(toSend.headers[http2.constants.HTTP2_HEADER_CONTENT_TYPE]).indexOf('json') !== -1))) {
              toSend.parsed = parser(resc);
            }
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
      if (http2Options) {
        res.on('response', capture);
      } else {
        res.once('error', respond);
      }
      res.once('end', respond);
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
    if (http2Options) {
      GLOBAL_METHODS.assign(headers, {
        [http2.constants.HTTP2_HEADER_SCHEME]: obj.protocol.slice(0, -1),
        [http2.constants.HTTP2_HEADER_METHOD]: obj.method,
        [http2.constants.HTTP2_HEADER_PATH]: obj.pathname,
      });
    }
    var req;
    if (debugVal) {
      if (debugVal > 1) {
        console.log('REQ:', method, url, headers, (mo || payload));
        console.log(headers);
        console.log(mo || payload);
      } else {
        console.log('REQ:', method, url);
      }
    }
    function timeoutRespond(req) {
      req.destroy();
      cb('TIMEOUT', 'ERROR_WHILE_REQUEST');
    }
    if (http2Options) {
      req = client.request(headers);
      client.setTimeout(obj.timeout, timeoutRespond.bind(null, req));
      uponResponse(req);
    } else {
      req = (obj.protocol === 'https:' ? https : http).request(obj, uponResponse);
      for (var hdrKey in headers) {
        req.setHeader(hdrKey, headers[hdrKey]);
      }
      req.on('timeout', timeoutRespond.bind(null, req));
    }
    req.once('error',function(er){
      return cb(er, 'ERROR_WHILE_REQUEST');
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
        return cb(er, 'ERROR_WITH_FILE_STREAM');
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
