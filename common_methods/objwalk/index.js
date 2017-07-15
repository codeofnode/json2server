
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  const maxobjdepth = (GLOBAL_APP_CONFIG && GLOBAL_APP_CONFIG.maxobjdepth) || 99;

  const getNested = function(obj, depth) {
    return ((depth < maxobjdepth && typeof obj === 'object' && obj !== null && obj.$W_END !== true) ? obj : false);
  };

  const walkInto = function(fun, rt, obj, key, depth = 0, isLast = true) {
    fun(obj, key, rt, depth, isLast);
    const ob = getNested(obj, depth);
    if (ob) {
      const kys = Object.keys(ob);
      const lastln = kys.length;
      const deep = depth + 1;
      for (let z = 0; z <= lastln; z += 1) {
        walkInto(fun, ob, ob[kys[z]], kys[z], deep, (z === lastln));
      }
    }
  };

  return walkInto;
}
