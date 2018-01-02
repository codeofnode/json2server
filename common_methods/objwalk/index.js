
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  if (typeof GLOBAL_APP_CONFIG !== 'object' || GLOBAL_APP_CONFIG === null) GLOBAL_APP_CONFIG = {};
  var maxobjdepth = GLOBAL_APP_CONFIG.maxobjdepth || 99;
  var endvar = GLOBAL_APP_CONFIG.walkendkey || '$W_END';

  var ifEndForObjWalk = GLOBAL_METHODS && GLOBAL_METHODS.ifEndForObjWalk;
  if(typeof ifEndForObjWalk !== 'function') {
   ifEndForObjWalk = function(obj, depth) {
      return ((depth < maxobjdepth && typeof obj === 'object'
        && obj !== null && obj[endvar] !== true
        && (Array.isArray(obj) || isPOJO(obj))) ? obj : false);
    };
  };

  var isPOJO = GLOBAL_METHODS && GLOBAL_METHODS.isPOJO;
  if(typeof isPOJO !== 'function') {
    var ProtoObj = Object.prototype;
    var getProtOf = Object.getPrototypeOf;

    isPOJO = function func(obj){
      if (obj === null || typeof obj !== 'object') {
        return false;
      }
      return getProtOf(obj) === ProtoObj;
    };
  };

  var walkInto = function(fun, rt, obj, key, depth, isLast) {
    if(!depth) depth = 0;
    fun(obj, key, rt, depth || 0, typeof isLast === 'boolean' ? isLast : true);
    var ob = ifEndForObjWalk(obj, depth);
    if (ob) {
      var kys = Object.keys(ob);
      var lastln = kys.length - 1;
      var deep = depth + 1;
      for (var z = 0; z <= lastln; z += 1) {
        walkInto(fun, ob, ob[kys[z]], kys[z], deep, (z === lastln));
      }
    }
  };

  return walkInto;
}
