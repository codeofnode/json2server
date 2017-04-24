#! /usr/bin/env node

var path = require('path');
var MAINS = require(path.join(process.cwd(), (process.argv[2] || 'api.json'))),
  fs = require('fs');
var ModuleDir = path.join(process.cwd(), process.env.MOD_DIR || 'modules');
var GLOBAL_METHODS = require('./index').methods;
try {
  fs.mkdirSync(ModuleDir);
} catch (erm) {}

var doneMap = {};

const N_REG = GLOBAL_METHODS.isAlphaNum;

GLOBAL_METHODS.replace(MAINS.vars, MAINS.vars);
GLOBAL_METHODS.replace(MAINS.root, MAINS.vars);

var kys = ['+', '=', '$', '$get', '$post', '$put', '$delete', '$options', '>', '$patch', '*'];

var forOneModule = function(bs) {
  var mods = [];
  var pths = [ModuleDir];
  if (!(Array.isArray(bs))) bs = [];
  pths = pths.concat(bs);
  try {
    fs.mkdirSync(path.join.apply(path, pths.concat(['_methods'])));
  } catch (erm) {}
  var toCreateMethods = [];
  kys.forEach(function(ky) {
    GLOBAL_METHODS.objwalk(function(vl) {
      var kn = GLOBAL_METHODS.lastValue(vl, '@');
      if (typeof kn === 'string' && N_REG(kn) && isNaN(Number(kn))) {
        toCreateMethods.push(vl['@']);
      }
    }, null, GLOBAL_METHODS.lastValue.apply(null, [MAINS.root].concat(bs).concat([ky])));
  });
  toCreateMethods.forEach(function(ky) {
    if (doneMap[ky]) return;
    doneMap[ky] = true;
    try {
      fs.mkdirSync(path.join.apply(path, pths.concat(['_methods', ky])));
    } catch (erm) {}
  });
  toCreateMethods.forEach(function(ky) {
    var ph = path.join.apply(path, pths.concat(['_methods', ky, 'index.js']));
    if (!(fs.existsSync(ph))) {
      try {
        fs.writeFileSync(ph, '\nfunction func(vars,methods,req,res){\n\n}\n\nmodule.exports = func;');
      } catch (erm) {}
    }
  });
  var ms = [];
  pths.shift();
  try {
    ms = Object.keys(GLOBAL_METHODS.lastValue.apply(null, [MAINS.root].concat(pths))).filter(N_REG);
  } catch (erm) {
    return;
  }
  ms.forEach(function(ms) {
    if (typeof ms === 'string' && N_REG(ms) && isNaN(Number(ms))) {
      try {
        fs.mkdirSync(path.join.apply(path, [ModuleDir].concat(pths).concat([ms])));
      } catch (erm) {}
      forOneModule(pths.concat([ms]));
    }
  });
};

forOneModule();