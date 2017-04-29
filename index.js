var GLOBAL_APP_CONFIG = {},
  GLOBAL_METHODS = {};
//_ONLY_SERVER
const NodePath = require('path'),
  NodeFs = require('fs');
//_ONLY_SERVER_END
//NO_OUT_FILE
const Iterate = require('./internal_methods/iterateRecursive');
//END_NO_OUT_FILE


GLOBAL_METHODS.assign = require('./common_methods/assign')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.isAlphaNum = require('./common_methods/isAlphaNum')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.lastValue = require('./common_methods/lastValue')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.makeToLast = require('./common_methods/makeToLast')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.objwalk = require('./common_methods/objwalk')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.replace = require('./common_methods/replace')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.resolveSlash = require('./common_methods/resolveSlash')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.stringify = require('./common_methods/stringify')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.request = require('./server_methods/request')(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);

//CLIENT_METHODS_BLOCK

Object.freeze(GLOBAL_METHODS);

const SERVER = require('./client_server/server'),
  HANDLER = require('./client_server/server_handler'),
  ENGINE = SERVER(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);

function func(CONFIG_PATH, JSON_PATH, ROOT_DIR_PATH, GLOBAL_VARS, GLOBAL_API) {
  const ASSIGN = GLOBAL_METHODS.assign,
    REPL = GLOBAL_METHODS.replace,
    lastValue = GLOBAL_METHODS.lastValue,
    N_REG = GLOBAL_METHODS.isAlphaNum;
  //NO_OUT_FILE
  if (!ROOT_DIR_PATH) ROOT_DIR_PATH = NodePath.join(process.cwd(), 'root');
  //END_NO_OUT_FILE
  var MAINS = {},
    fromConfigReq = {},
    fromJsonReq = {},
    httsConfig = false;
  //_NOT_IN_FILE
  //_ONLY_SERVER
  try {
    fromConfigReq = require((typeof CONFIG_PATH === 'string' && CONFIG_PATH.length) ? CONFIG_PATH : (process.cwd() + '/j2s.json'));
  } catch (erm) {
    console.log('WARNING : j2s.json not loaded.');
    console.log(erm);
  }
  //_ONLY_SERVER_END
  ASSIGN(GLOBAL_APP_CONFIG, fromConfigReq);
  ASSIGN(GLOBAL_APP_CONFIG, CONFIG_PATH);
  //END_NOT_IN_FILE
  //_ONLY_SERVER
  if (typeof GLOBAL_APP_CONFIG.httsConfig === 'object' &&
    GLOBAL_APP_CONFIG.httsConfig !== null && (!Array.isArray(GLOBAL_APP_CONFIG.httsConfig))) {
    if (typeof GLOBAL_APP_CONFIG.httsConfig.key === 'string') {
      httsConfig.key = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httsConfig.key);
    }
    if (typeof GLOBAL_APP_CONFIG.httsConfig.cert === 'string') {
      httsConfig.cert = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httsConfig.cert);
    }
    if (typeof GLOBAL_APP_CONFIG.httsConfig.pfx === 'string') {
      httsConfig.pfx = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httsConfig.pfx);
    }
    if (typeof GLOBAL_APP_CONFIG.httsConfig.passphrase === 'string') {
      httsConfig.passphrase = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httsConfig.passphrase);
    }
  }
  delete GLOBAL_APP_CONFIG.httsConfig;
  //_ONLY_SERVER_END
  Object.freeze(GLOBAL_APP_CONFIG);
  if ((typeof GLOBAL_VARS === 'object' && GLOBAL_VARS !== null && !(Array.isArray(GLOBAL_VARS))) &&
    (typeof GLOBAL_API === 'object' && GLOBAL_API !== null && !(Array.isArray(GLOBAL_API)))) {} else {
    //_NOT_IN_FILE
    //_ONLY_SERVER
    try {
      fromJsonReq = require((typeof JSON_PATH === 'string' && JSON_PATH.length) ? JSON_PATH : (process.cwd() + '/server.json'));
    } catch (erm) {
      console.log('WARNING : server.json not loaded.');
      console.log(erm);
    }
    //_ONLY_SERVER_END
    ASSIGN(MAINS, fromJsonReq);
    ASSIGN(MAINS, JSON_PATH);
    Object.freeze(MAINS);

    GLOBAL_API = require('./defaults.json');

    ASSIGN(GLOBAL_API.vars.errors, GLOBAL_METHODS.lastValue(MAINS, 'vars', 'errors'));
    ASSIGN(GLOBAL_API.vars.app, GLOBAL_METHODS.lastValue(MAINS, 'vars', 'app'));
    ASSIGN(GLOBAL_API.vars, MAINS.vars);
    if (typeof MAINS.root === 'object' && MAINS.root) {
      ASSIGN(GLOBAL_API.root, MAINS.root);
    }

    REPL(GLOBAL_API, GLOBAL_API.vars);
    GLOBAL_VARS = GLOBAL_API.vars;
    delete GLOBAL_API.vars;

    //NO_OUT_FILE
    Iterate(function(bs) {
      return lastValue.apply(lastValue, [GLOBAL_API.root].concat(bs));
    }, ROOT_DIR_PATH, function(cr, ms, func) {
      cr._methods[ms] = func(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS);
    }, function(cr, vrt) {
      cr._vars = vrt;
    }, N_REG);
    //END_NO_OUT_FILE
    //END_NOT_IN_FILE
  }

  Object.freeze(GLOBAL_VARS);
  Object.freeze(GLOBAL_API);

  function start(hndlr, hc) {
    ENGINE((hndlr || HANDLER)(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API), (hc || httsConfig));
  }

  start.api = GLOBAL_API;
  start.config = GLOBAL_APP_CONFIG;
  return start;
}
//NO_OUT_FILE

module.exports = func;
module.exports.methods = GLOBAL_METHODS;
module.exports.server = SERVER;
module.exports.handler = HANDLER;
module.exports.engine = ENGINE;
//END_NO_OUT_FILE