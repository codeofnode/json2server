
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function loop(inp,key){
    if(inp !== undefined && inp !== null){
      return inp[key];
    } else return undefined;
  }

  function func(root){
    var len = arguments.length, now = root, moveWith = loop;
    if(len < 1) return undefined;
    if(len === 1) return root;
    var func = arguments[len - 1];
    if(typeof func === 'function'){
      len--;
      moveWith = func;
    }
    for(var z =1;z<len;z++){
      now = moveWith(root,arguments[z]);
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
