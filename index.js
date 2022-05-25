var GLOBAL_APP_CONFIG = { requestResponse: { debug: process && process.env && process.env.REQRES_DEBUG } },
  GLOBAL_METHODS = {};
//_ONLY_SERVER
var NodePath = require('path'),
  NodeFs = require('fs');
//_ONLY_SERVER_END
//NO_OUT_FILE
var Iterate = require('./internal_methods/iterateRecursive');
//END_NO_OUT_FILE


GLOBAL_METHODS.assign = require('./common_methods/assign')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.isAlphaNum = require('./common_methods/isAlphaNum')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.lastValue = require('./common_methods/lastValue')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.makeToLast = require('./common_methods/makeToLast')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.objwalk = require('./common_methods/objwalk')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.replace = require('./common_methods/replace')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.resolveSlash = require('./common_methods/resolveSlash')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.stringify = require('./common_methods/stringify')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.parsePayload = require('./server_methods/parsePayload')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);
GLOBAL_METHODS.request = require('./server_methods/request')(GLOBAL_APP_CONFIG, GLOBAL_METHODS);

//CLIENT_METHODS_BLOCK

Object.freeze(GLOBAL_METHODS);

var SERVER = require('./client_server/server'),
  HANDLER = require('./client_server/server_handler'),
  ENGINE = SERVER(GLOBAL_APP_CONFIG, GLOBAL_METHODS);

function func(CONFIG_PATH, JSON_PATH, ROOT_DIR_PATH, GLOBAL_VARS, GLOBAL_API) {
  var ASSIGN = GLOBAL_METHODS.assign,
    REPL = GLOBAL_METHODS.replace,
    lastValue = GLOBAL_METHODS.lastValue,
    N_REG = GLOBAL_METHODS.isAlphaNum;
  //NO_OUT_FILE
  if (!ROOT_DIR_PATH) ROOT_DIR_PATH = NodePath.join(process.cwd(), 'root');
  //END_NO_OUT_FILE
  var MAINS = {},
    fromConfigReq = {},
    fromJsonReq = {},
    httpsConfig = false;
  //_NOT_IN_FILE
  //_ONLY_SERVER
  try {
    fromConfigReq = require((typeof CONFIG_PATH === 'string' && CONFIG_PATH.length) ? CONFIG_PATH : (process.cwd() + '/j2s.json'));
  } catch (erm) {}
  //_ONLY_SERVER_END
  ASSIGN(GLOBAL_APP_CONFIG, fromConfigReq, CONFIG_PATH);
  //END_NOT_IN_FILE
  //_ONLY_SERVER
  if (typeof GLOBAL_APP_CONFIG.httpsConfig === 'object' &&
    GLOBAL_APP_CONFIG.httpsConfig !== null && (!Array.isArray(GLOBAL_APP_CONFIG.httpsConfig))) {
    httpsConfig = {
      allowHTTP1: GLOBAL_APP_CONFIG.http2 && GLOBAL_APP_CONFIG.http2.allowHTTP1 === true
    }
    if (typeof GLOBAL_APP_CONFIG.httpsConfig.key === 'string') {
      httpsConfig.key = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httpsConfig.key);
    }
    if (typeof GLOBAL_APP_CONFIG.httpsConfig.cert === 'string') {
      httpsConfig.cert = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httpsConfig.cert);
    }
    if (typeof GLOBAL_APP_CONFIG.httpsConfig.pfx === 'string') {
      httpsConfig.pfx = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httpsConfig.pfx);
    }
    if (typeof GLOBAL_APP_CONFIG.httpsConfig.passphrase === 'string') {
      httpsConfig.passphrase = NodeFs.readFileSync(GLOBAL_APP_CONFIG.httpsConfig.passphrase);
    }
  }
  delete GLOBAL_APP_CONFIG.httpsConfig;
  if (GLOBAL_APP_CONFIG.http2) {
    delete GLOBAL_APP_CONFIG.http2.allowHTTP1;
  }
  //_ONLY_SERVER_END
  if ((typeof GLOBAL_VARS === 'object' && GLOBAL_VARS !== null && !(Array.isArray(GLOBAL_VARS))) &&
    (typeof GLOBAL_API === 'object' && GLOBAL_API !== null && !(Array.isArray(GLOBAL_API)))) {} else {
    //_NOT_IN_FILE
    //_ONLY_SERVER
    try {
      fromJsonReq = require((typeof JSON_PATH === 'string' && JSON_PATH.length) ? JSON_PATH : (process.cwd() + '/server.json'));
    } catch (erm) {
      console.log('json2server > WARNING: server json file not loaded. ', erm.message);
    }
    //_ONLY_SERVER_END
    ASSIGN(MAINS, fromJsonReq, JSON_PATH);
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
      return lastValue.apply(lastValue, [GLOBAL_API.root].concat(bs).concat([function(rt, key) {
        if ([undefined, null].indexOf(rt[key]) === -1) {
          return rt[key];
        } else {
          if ([undefined, null].indexOf(rt[':' + key]) === -1) {
            return rt[':' + key];
          } else {
            return undefined;
          }
        }
      }]));
    }, ROOT_DIR_PATH, function(cr, ms, func) {
      cr._methods[ms] = func(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API);
    }, function(cr, vrt) {
      cr._vars = vrt;
    }, N_REG);
    //END_NO_OUT_FILE
    //END_NOT_IN_FILE
  }

  Object.freeze(GLOBAL_VARS);
  Object.freeze(GLOBAL_API);

  function start(hndlr, hc) {
    ENGINE((hndlr || HANDLER)(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API), (hc || httpsConfig), GLOBAL_API);
  }

  var onLoad = GLOBAL_METHODS.lastValue(GLOBAL_API, 'root', '_methods', 'onLoad');
  if (typeof onLoad === 'function') {
    onLoad(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API);
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
