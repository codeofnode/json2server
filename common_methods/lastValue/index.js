
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function loop(inp,key){
    if(inp !== undefined && inp !== null){
      return inp[key];
    } else return undefined;
  }

  function func(root){
    var len = arguments.length, now = root;
    for(var z =1;z<len;z++){
      now = loop(root,arguments[z]);
      if(now === undefined){
        break;
      } else {
        root = now;
      }
    }
    return now;
  }

  return func;
}
