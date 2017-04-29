
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(st,pretty){
    if(typeof st !== 'string'){
      if(typeof st === 'object'){
        try {
          st = pretty ? JSON.stringify(st, null, '  ') : JSON.stringify(st);
        } catch(er){
          st = String(st);
        }
      } else {
        st = String(st);
      }
    }
    return st;
  }

  return func;
}
