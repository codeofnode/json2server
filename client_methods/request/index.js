
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function isObject(ob){
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  function func(options,cb){
    var url, method, payload, headers, parser;
    if(typeof cb !== 'function'){
      cb = function(){};
    }
    if(typeof options === 'string'){
      url = options;
      parser = JSON.parse;
    } else if(isObject(options)){
      url = options.url;
      method = options.method;
      payload = typeof options.body === 'undefined' ? options.payload : options.body;
      headers = options.headers;
      parser = typeof options.parser === 'function' ? options.parser : JSON.parse;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if(typeof url !== 'string' || !url.length){
      return cb('URL_NOT_FOUND');
    }
    if(typeof method !== 'string' || !method.length){
      method = 'GET';
    }
    var httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      return cb('XMLHTTP_NOT_AVAILABLE');
    }
    httpRequest.onreadystatechange = function(){
      if(httpRequest.readyState === XMLHttpRequest.DONE) {
        var resHeaders = httpRequest.getAllResponseHeaders();
        var toSend = {
          statusCode : httpRequest.status,
          content : httpRequest.responseText,
        };
        if(resHeaders){
          toSend.headers = resHeaders.split('\n');
        }
        if(httpRequest.responseXML){
          toSend.parsed = httpRequest.responseXML;
        } else if(typeof parser === 'function'){
          try {
            toSend.parsed = parser(httpRequest.responseText);
          } catch(er){
            toSend.parseError = er;
          }
        }
        if (typeof toSend.statusCode === 'number' && Math.floor((toSend.statusCode / 100)) === 2) {
          cb(null, toSend);
        } else {
          cb(toSend);
        }
      }
    }
    httpRequest.open(method, url, true);
    var contFound = false;
    if(isObject(options.headers)){
      for(var ky in options.headers){
        if(typeof options.headers[ky] === 'string'){
          if(ky.toLowerCase() === 'content-type'){
            contFound = true;
          }
          httpRequest.setRequestHeader(ky, options.headers[ky]);
        }
      }
    }
    if(!(contFound)){
      httpRequest.setRequestHeader('content-type', 'application/json');
    }
    if (payload !== undefined) {
      payload = GLOBAL_METHODS.stringify(payload);
      httpRequest.send(payload);
    } else {
      httpRequest.send();
    }
    return httpRequest;
  }

  return func;
}
