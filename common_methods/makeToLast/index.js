
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(root){
    var len = arguments.length, now = root;
    for(var z =1;z<len;z++){
      if(now[arguments[z]] === undefined || now[arguments[z]] === null){
        now[arguments[z]] = {};
      }
      root = now = now[arguments[z]];
    }
    return now;
  }

  return func;
}
