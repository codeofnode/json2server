
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
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
      protocol : lc.protocol
    };
  }

  return func;
}
