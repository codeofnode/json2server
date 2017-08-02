
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  if (typeof GLOBAL_APP_CONFIG !== 'object' || GLOBAL_APP_CONFIG === null) GLOBAL_APP_CONFIG = {};
  const maxobjdepth = GLOBAL_APP_CONFIG.maxobjdepth || 99;
  const endvar = GLOBAL_APP_CONFIG.walkendkey || '$W_END';

  let ifEndForObjWalk = GLOBAL_METHODS && GLOBAL_METHODS.ifEndForObjWalk;
  if(typeof ifEndForObjWalk !== 'function') {
   ifEndForObjWalk = function(obj, depth) {
      return ((depth < maxobjdepth && typeof obj === 'object'
        && obj !== null && obj[endvar] !== true) ? obj : false);
    };
  };

  const walkInto = function(fun, rt, obj, key, depth, isLast) {
    if(!depth) depth = 0;
    fun(obj, key, rt, depth || 0, typeof isLast === 'boolean' ? isLast : true);
    const ob = ifEndForObjWalk(obj, depth);
    if (ob) {
      const kys = Object.keys(ob);
      const lastln = kys.length - 1;
      const deep = depth + 1;
      for (let z = 0; z <= lastln; z += 1) {
        walkInto(fun, ob, ob[kys[z]], kys[z], deep, (z === lastln));
      }
    }
  };

  return walkInto;
}
