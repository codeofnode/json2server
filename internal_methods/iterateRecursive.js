
const NodeFs = require('fs'), NodePath = require('path'),
      isAlphaNum = require('./../common_methods/isAlphaNum')();

module.exports = function(getCurr, ROOT_DIR_PATH, forMod, forVar, N_REG){
  if(typeof getCurr !== 'function') throw new Error('First parameter must be a function');
  if(typeof forMod !== 'function') forMod = function(){};
  if(typeof forVar !== 'function') forVar = function(){};
  if(typeof N_REG !== 'function') N_REG = isAlphaNum;
  var forOneModule = function(bs){
    var mods =[];
    var pths = [];
    if(!(Array.isArray(bs))) bs = [];
    pths = [ROOT_DIR_PATH].concat(bs);
    try {
      mods = NodeFs.readdirSync(NodePath.join.apply(NodePath, pths.concat(['_methods']))).filter(N_REG);
    } catch(erm){ }
    var cr = getCurr(bs);
    if(cr){
      if(!cr._methods) cr._methods = {};
      var vrt = false, vpthns = pths.concat(['vars.json']);
      try { var vrt = require(NodePath.join.apply(NodePath, vpthns)); } catch(er){}
      if(vrt){ forVar(cr,vrt,vpthns); }
      mods.forEach(function(ms){
        var pthns = pths.concat(['_methods',ms]);
        forMod(cr,ms,require(NodePath.join.apply(NodePath, pthns)),pthns);
      });
    }
    var ms = [];
    try { ms = NodeFs.readdirSync(NodePath.join.apply(NodePath, pths)).filter(N_REG); } catch(erm){ return; }
    pths.shift();
    ms.forEach((ms)=>{ forOneModule(pths.concat([ms])); });
  };

  forOneModule();
}
