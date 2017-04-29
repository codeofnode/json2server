
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function func(ab,bb,noob){
    if(typeof ab !== 'object' || !ab) ab = Array.isArray(bb) ? new Array(bb.length) : {};
    if(typeof bb === 'object' && bb){
      var kys = Object.keys(bb), kl = kys.length;
      for(var j =0; j< kl; j++){
        if(!noob || (typeof ab[kys[j]] !== 'object')|| (typeof bb[kys[j]] !== 'object')){
          ab[kys[j]] = bb[kys[j]];
        }
      }
    }
    return ab;
  }

  return func;
}
