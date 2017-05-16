
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function parseQuery(qstr) {
    var query = {};
    var a = qstr.substr(1).split('&');
    for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
  }

  function func(){
    var lc = location;
    return {
      hash : lc.hash,
      host : lc.host,
      hostname : lc.hostname,
      href : lc.href,
      origin : lc.origin,
      pathname : lc.pathname,
      port : lc.port,
      query : parseQuery(lc.search),
      protocol : lc.protocol
    };
  }

  return func;
}
