var path = require('path');
var fs = require('fs');
var GLOBAL_METHODS=require('./../index.js').methods;
var doneMap = {};

const N_REG = GLOBAL_METHODS.isAlphaNum;

var kys = ['+','=','$', '$get', '$post', '$put', '$delete', '$options', '>', '$patch', '*'];

module.exports = function(ModuleDir,apiFile, startFile){

  try {
    fs.mkdirSync(ModuleDir);
  } catch(erm){
  }

  var MAINS = require(apiFile);

  GLOBAL_METHODS.replace(MAINS.vars, MAINS.vars);
  GLOBAL_METHODS.replace(MAINS.root, MAINS.vars);

  if(startFile) {
    require('fs').writeFileSync(startFile, "var j2s = require('json2server')(); j2s.start();");
  }

  var forOneModule = function(bs){
    var mods =[];
    var pths = [ModuleDir];
    if(!(Array.isArray(bs))) bs = [];
    pths = pths.concat(bs);
    var ls = Object.assign([],pths);
    if(ls[ls.length-1] && ls[ls.length-1].charAt(0) === ':'){
      ls[ls.length-1] = ls[ls.length-1].substring(1);
    }
    try {
      fs.mkdirSync(path.join.apply(path, ls.concat(['_methods'])));
    } catch(erm){
    }
    var toCreateMethods = [];
    kys.forEach(function(ky){
      GLOBAL_METHODS.objwalk(function(vl){
        var kn = GLOBAL_METHODS.lastValue(vl,'@');
        if(typeof kn ==='string' && N_REG(kn) && isNaN(Number(kn))){
          toCreateMethods.push(vl['@']);
        }
      },null,GLOBAL_METHODS.lastValue.apply(null, [MAINS.root].concat(bs).concat([ky])));
    });
    toCreateMethods.forEach(function(ky){
      if(doneMap[ky]) return;
      doneMap[ky]=true;
      try {
        fs.mkdirSync(path.join.apply(path, ls.concat(['_methods', ky])));
      } catch(erm){
      }
    });
    toCreateMethods.forEach(function(ky){
      var ph =path.join.apply(path, ls.concat(['_methods', ky, 'index.js']));
      if(!(fs.existsSync(ph))) {
        try {
          fs.writeFileSync(ph, 'module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS,GLOBAL_API){\n\nfunction func(vars,methods,req,res){\n\n}\n\nreturn func;\n\n}\n');
        } catch(erm){
        }
      }
    });
    var ms = [],_ms = {};
    pths.shift();
    ls.shift();
    var nls = Object.assign([],ls);
    try {
      Object.keys(GLOBAL_METHODS.lastValue.apply(null, [MAINS.root].concat(nls))).forEach(function(m){
        var _m = m;
        if(m.charAt(0) === ':'){
          m = m.substring(1);
        }
        if(N_REG(m)){
          ms.push(m);
          _ms[m] = _m;
        }
      });
    } catch(erm){
      return;
    }
    ms.forEach(function(mt){
      if(typeof mt ==='string' && isNaN(Number(mt))){
        try {
          fs.mkdirSync(path.join.apply(path, [ModuleDir].concat(ls).concat([mt])));
        } catch(erm){
        }
        forOneModule(pths.concat([_ms[mt]]));
      }
    });
  };

  forOneModule();
};
