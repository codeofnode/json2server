module.exports = function(FOR_WHICH,nocomm){
  var GLB_STR = '', ar = [FOR_WHICH+'_methods'];
  if(!(nocomm)) ar.unshift('common_methods');

  ar.forEach(function(mthds){
    var methods = require('fs').readdirSync(__dirname + '/../'+mthds).filter(function(name){ return name.charAt(0) !== '.'; });
    methods.forEach(function(mth){
      GLB_STR += '\nGLOBAL_METHODS.'+mth+' = require(\'./'+mthds+'/'+mth+'\')(require,GLOBAL_APP_CONFIG,GLOBAL_METHODS);';
    });
  });

  return GLB_STR;
}
