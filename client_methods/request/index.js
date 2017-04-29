
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function isObect(ob){
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  function func(options,cb){
    var url, method, payload, headers, toParse;
    if(typeof cb !== 'function'){
      cb = function(){};
    }
    if(typeof options === 'string'){
      url = options;
      method = 'GET';
      toParse = JSON.parse;
    } else if(isObect(options)){
      url = options.url;
      method = options.method;
      payload = options.payload;
      headers = options.headers;
      toParse = options.toParse;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if(typeof url !== 'string' || !url.length){
      return cb('URL_NOT_FOUND');
    }
    if(typeof method !== 'string' || !method.length){
      return cb('METHOD_NOT_FOUND');
    }
    var httpRequest = new require.XMLHttpRequest();
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
        } else if(typeof toParse === 'function'){
          try {
            toSend.parsed = toParse(httpRequest.responseText);
          } catch(er){
            toSend.parseError = er;
          }
        }
        cb(null, toSend);
      }
    }
    httpRequest.open(method, url, true);
    if(isObect(options.headers)){
      for(var ky in options.headers){
        if(typeof options.headers[ky] === 'string'){
          httpRequest.setRequestHeader(ky, options.headers[ky]);
        }
      }
    }
    if(typeof payload !== undefined){
      payload = GLOBAL_METHODS.stringify(payload);
      httpRequest.send(payload);
    } else {
      httpRequest.send();
    }
  }

  return func;
}
