
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function walkInto(fun, rt, obj, key, isLast){
    fun(obj, key, rt, typeof isLast === 'boolean' ? isLast : true);
    if(typeof obj === 'object' && obj && obj['$W_END'] !== true){
      var kys = Object.keys(obj), kl = kys.length;
      for(var j =0; j< kl; j++){
        walkInto(fun, obj, obj[kys[j]], kys[j], (j === (kl-1)));
      }
    }
  }

  return walkInto;
}
