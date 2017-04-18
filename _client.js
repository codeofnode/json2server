#! /usr/bin/env node

var SERVER_FILE_NAME = 'client.js';
var MAIN_MODULES = {
  _methods: {},
  _mains: {}
};
const fs = require('fs'),
  path = require('path');
const DEFAULTS = require(path.join(__dirname, 'defaults.json'));
var GLOBAL_METHODS = MAIN_MODULES._methods;
var MAINS = {};
try {
  MAINS = require(path.join(process.cwd(), 'api.json'));
} catch (er) {
  console.log('`api.json` not available..!');
  console.log(er);
}
var GLOBAL_API = DEFAULTS,
  FILE_STR = 'GLOBAL_METHODS={}; GLOBAL_APP_CONFIG = {};';
FILE_STR += 'try { GLOBAL_APP_CONFIG = require(\'./config.json\'); } catch(erm){ }';
GLOBAL_METHODS.assign = (function() {
  function func(ab, bb, noob) {
    if (typeof ab !== 'object' || !ab) ab = Array.isArray(bb) ? new Array(bb.length) : {};
    if (typeof bb === 'object' && bb) {
      var kys = Object.keys(bb),
        kl = kys.length;
      for (var j = 0; j < kl; j++) {
        if (!noob || (typeof ab[kys[j]] !== 'object') || (typeof bb[kys[j]] !== 'object')) {
          ab[kys[j]] = bb[kys[j]];
        }
      }
    }
    return ab;
  }

  return func;
});
GLOBAL_METHODS.isAlphaNum = (function() {
  function func(st) {
    return Boolean(!(/[^A-Za-z0-9]/).test(st));
  }

  return func;
});
GLOBAL_METHODS.lastValue = (function() {
  function loop(inp, key) {
    if (inp !== undefined && inp !== null) {
      return inp[key];
    } else return undefined;
  }

  function func(root) {
    var len = arguments.length,
      now = root;
    for (var z = 1; z < len; z++) {
      now = loop(root, arguments[z]);
      if (now === undefined) {
        break;
      } else {
        root = now;
      }
    }
    return now;
  }

  return func;
});
GLOBAL_METHODS.makemsg = (function() {
  function func(vars, msgname, args) {
    var ln = args.length,
      st = GLOBAL_METHODS.lastValue(vars.locale, vars.currentLocale, msgname);
    if (st === undefined) return 'LOCALE_MESSAGE_ERROR';
    for (var vm = 0; vm < ln; vm++) {
      if (typeof args[vm] === 'function') {
        return args[vm]({
          _: st,
          status: 400
        });
      }
      st = st.replace(('\{\{' + vm + '\}\}'), typeof args[vm] === 'string' ? args[vm] : JSON.stringify(args[vm]));
    }
    return st;
  }

  return func;
});
GLOBAL_METHODS.objwalk = (function() {
  function walkInto(fun, rt, obj, key, isLast) {
    fun(obj, key, rt, typeof isLast === 'boolean' ? isLast : true);
    if (typeof obj === 'object' && obj && obj['$W_END'] !== true) {
      var kys = Object.keys(obj),
        kl = kys.length;
      for (var j = 0; j < kl; j++) {
        walkInto(fun, obj, obj[kys[j]], kys[j], (j === (kl - 1)));
      }
    }
  }

  return walkInto;
});
GLOBAL_METHODS.replace = (function() {
  const START_VAR = '{{',
    END_VAR = '}}',
    SVAR_L = 2,
    EVAR_L = 2,
    NOT_FOUND_MSG = 'VAR_NOT_FOUND',
    VAR_REG = /(\{\{[a-zA-Z0-9\$\.\_]+\}\})+/g;

  const WALK_INTO = GLOBAL_METHODS.objwalk,
    IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum,
    ASSIGN = GLOBAL_METHODS.assign;

  function isWithVars(st) {
    if (st && typeof st === 'string' && st.length > (END_VAR.length + START_VAR.length)) {
      var f = st.indexOf(START_VAR),
        l = st.indexOf(END_VAR);
      return (f !== -1 && l !== -1) ? [f, l] : false;
    } else return false;
  }

  function _noUndefined(st, def) {
    return st === undefined ? def : st;
  }

  function getVarVal(varVal, varName, variablesMap) {
    if (typeof variablesMap !== 'object' || !variablesMap) {
      return varVal;
    }
    if (varName.indexOf('.') !== -1) {
      var spls = varName.split('.'),
        ln = spls.length,
        valFound = true;
      if (ln) {
        var base = getVarVal(spls[0], spls[0], variablesMap),
          curVal;
        for (var j = 1; j < ln; j++) {
          if (spls[j].length) {
            if (typeof base === 'object') {
              curVal = replace(spls[j], variablesMap);
              try {
                base = base[curVal];
              } catch (erm) {
                valFound = false;
              }
            } else {
              valFound = false;
            }
          }
        }
        if (valFound) {
          return _noUndefined(base, varVal);
        }
      }
    }
    return variablesMap.hasOwnProperty(varName) ? variablesMap[varName] : _noUndefined(varVal);
  }

  function extractVars(str) {
    return str.match(VAR_REG) || [];
  }

  function extractVarName(variable) {
    return variable.substring(SVAR_L, variable.length - EVAR_L);
  }

  function _replace(st, vars) {
    var replaced, varName, nvars = extractVars(st),
      reRep = false;
    for (var i = 0; i < nvars.length; i++) {
      varName = extractVarName(nvars[i]);
      replaced = getVarVal(nvars[i], varName, vars);
      if (st === nvars[i]) return replaced;
      var rValue = (typeof replaced === 'string') ? replaced : JSON.stringify(replaced);
      st = st.replace(nvars[i], function() {
        return rValue;
      });
    }
    return st;
  }

  function replace(st, vars, ins) {
    if (typeof st === 'string') {
      if (typeof vars !== 'object' || !vars) {
        return st;
      }
      if (!(Array.isArray(ins))) {
        ins = isWithVars(st);
      }
      if (!(ins)) {
        return st;
      }
      var reRep = (st.indexOf('.' + START_VAR) !== -1) && (st.indexOf(END_VAR + '.') !== -1);
      st = _replace(st, vars);
      if (reRep) {
        st = _replace(st, vars);
      }
    }
    return st;
  }

  function handleFunction(inp, vars, methods) {
    if (typeof methods === 'object' && typeof inp === 'object' && inp && (typeof inp['@'] === 'string') &&
      IS_ALPHA_NUM(inp['@']) && (typeof methods[inp['@']] === 'function')) {
      var pms = (typeof inp.params === 'object' && inp.params !== null) ? ASSIGN(false, inp.params) : inp.params;
      var params = deepReplace(pms, vars, methods);
      if (!(Array.isArray(params))) {
        params = [params];
      }
      params.unshift(vars, methods);
      return methods[inp['@']].apply(null, params);
    }
    return inp;
  }

  function deepReplace(input, vars, methods) {
    if (typeof input !== 'object' || !input) {
      return replace(input, vars);
    }
    input = handleFunction(input, vars, methods);
    WALK_INTO(function(valn, key, rt) {
      if (typeof rt === 'object' && rt && typeof rt.hasOwnProperty === 'function' && rt.hasOwnProperty(key)) {
        var val = rt[key],
          tmpKy = null,
          isth = isWithVars(key);
        if (isth) {
          tmpKy = replace(key, vars, isth);
          if (tmpKy !== key) {
            val = rt[tmpKy] = rt[key];
            delete rt[key];
          }
        }
        if (typeof val === 'string' && val) {
          isth = isWithVars(val);
          if (isth) {
            rt[tmpKy || key] = replace(val, vars, isth);
          }
        } else {
          rt[tmpKy || key] = handleFunction(val, vars, methods);
        }
      }
    }, null, input);
    return input;
  }

  return deepReplace;
});
GLOBAL_METHODS.resolveSlash = (function() {
  function func(url, ls, rm) {
    if (typeof url === 'string') {
      if (ls) {
        if (rm) {
          url = url.endsWith('/') ? url.slice(0, -1) : url
        } else {
          url = url.endsWith('/') ? url : (url + '/')
        }
      } else {
        if (rm) {
          url = (url.charAt(0) === '/') ? url.slice(1) : url;
        } else {
          url = (url.charAt(0) === '/') ? url : ('/' + url);
        }
      }
    }
    return url;
  }

  return func;
});
GLOBAL_METHODS.stringify = (function() {
  function func(st) {
    if (typeof st !== 'string') {
      if (typeof st === 'object') {
        try {
          st = JSON.stringify(st);
        } catch (er) {
          st = String(st);
        }
      } else {
        st = String(st);
      }
    }
    return st;
  }

  return func;
});
MAIN_MODULES._mains.server = (function() {
  var mainHandler = false;

  var MAIN_CONT_ID = 'main-content-block';

  var ReqResMap = {};

  function getNewReqRes(idm) {
    if (ReqResMap[idm]) {
      return ReqResMap[idm];
    } else {
      ReqResMap[idm] = [new Request(), new Response()];
      return ReqResMap[idm];
    }
  }

  window.topath = function(route, title, data) {
    if (typeof route === 'string') {
      window.history.pushState(data, title, route);
    }
    var ar = getNewReqRes(location.pathname);
    GLOBAL_METHODS.hideAllChildren(document.getElementById(MAIN_CONT_ID));
    ar[1].element.style.display = 'block';
    mainHandler(ar[0], ar[1]);
  };

  var eventer = GLOBAL_METHODS.eventer();

  var evon = eventer.on.bind(eventer),
    evonce = eventer.once.bind(eventer),
    evemit = eventer.emit.bind(eventer),
    evremoveListener = eventer.removeListener.bind(eventer);

  function Request() {
    this.on = evon;
    this.once = evonce;
    this.emit = evemit;
    this.removeListener = evremoveListener;
    this.method = 'GET';
    var lc = location;
    this.parsedUrl = {
      hash: lc.hash,
      host: lc.host,
      hostname: lc.hostname,
      href: lc.href,
      origin: lc.origin,
      pathname: lc.pathname,
      port: lc.port,
      protocol: lc.protocol
    };
  }

  function createOrGetDiv(idm) {
    var curEl = document.getElementById(idm);
    var mainBlock = document.getElementById(MAIN_CONT_ID);
    if (!mainBlock) return alert('System not ready. Please refresh the page.');
    if (!curEl) {
      curEl = GLOBAL_METHODS.appendHtml(mainBlock, '<div id="' + idm + '"></div>');
    }
    return curEl;
  }

  function Response(opts) {
    this.divId = location.pathname.split('/').join('-')
    this.element = createOrGetDiv(this.divId);
  }

  Response.prototype.end = function(str) {
    switch (this.statusCode) {
      case 201:
        GLOBAL_METHODS.appendHtml(this.element, str);
        break;
      default:
        this.innerHTML = str;
    }
  };

  function server(handler) {
    if (!mainHandler) mainHandler = handler;
    topath();
  };

  return server;
});
MAIN_MODULES._mains.handler = (function() {
  const IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum;
  var S_VARS = GLOBAL_VARS;

  window.GlobalStore = GLOBAL_METHODS.store();

  function fromSource(src, after) {
    if (typeof src === 'string' && src.indexOf('http') === 0) {
      GLOBAL_METHODS.request(src, function(er, obj) {
        if (er) after(er);
        else if (typeof obj.status === 'number' && obj.status > 199 && obj.status < 300) {
          after(null, obj.parsed);
        } else {
          after(obj.parsed);
        }
      });
    } else {
      if (!Array.isArray(src)) {
        src = [src];
      }
      after(null, src);
    }
  }

  function getNewVars() {
    var cache = S_VARS;
    if (typeof cache.params !== 'object' || cache.params === null) cache.params = {};
    if (typeof cache.params.path !== 'object' || cache.params.path === null) cache.params.path = {};
    if (typeof cache.params.query !== 'object' || cache.params.query === null) cache.params.query = {};
    if (typeof cache.params.body !== 'object' || cache.params.body === null) cache.params.body = {};
    if (typeof cache.params.header !== 'object' || cache.params.header === null) cache.params.header = {};
    if (!(Array.isArray(cache.params.file))) cache.params.file = [];
    return cache;
  }

  var forOneObj = function(rq, rs, cache, methods, ob) {
    GLOBAL_METHODS.assign(cache, ob._vars);
    GLOBAL_METHODS.assign(methods, ob._methods);
    var kys = Object.keys(ob).sort(),
      kl = kys.length;
    var res = {};
    for (var ky, vl, z = 0; z < kl; z++) {
      ky = kys[z];
      vl = ob[ky];
      switch (ky) {
        case '*':
          if (String(GLOBAL_METHODS.replace(vl, cache, methods) === 'false')) {
            rq.notFound = true;
          }
          break;
        case '+':
          var pluskeys = Object.keys(vl),
            pl = pluskeys.length;

          function cl(ky, dt) {
            cache[ky] = evaluate(rq, rs, cache, methods, dt);
          }
          for (var n = 0; n < pl; n++) {
            cl(pluskeys[n], vl[pluskeys[n]]);
            if (typeof vl[pluskeys[n]].on === 'string' && vl[pluskeys[n]].on.length) {
              evaluate(rq, rs, cache, methods, vl[pluskeys[n]].on).split(',').forEach(function(ev) {
                ev = ev.trim();
                if (ev.length) {
                  rq.on(ev, cl.bind(null, pluskeys[n], vl[pluskeys[n]]));
                }
              });
            }
          }
          break;
        case '=':
          var pass = true;
          var assertions = Array.isArray(vl) ? vl : [],
            al = assertions.length;
          for (var n = 0; n < al; n++) {
            if (typeof vl[n] === 'string' && vl[n]) {
              vl[n] = {
                "eval": vl[n]
              };
            }
            if (typeof vl[n] === 'object' && vl[n]) {
              var ch = function(vl1, vl2, ps) {
                if (!vl2) vl2 = cache.errors.inval;
                if (ps) {
                  var er = evaluate(rq, rs, cache, methods, vl1);
                  if (er) {
                    if (typeof er === 'string') {
                      try {
                        er = eval(er);
                      } catch (erm) {
                        ps = false
                      }
                    }
                  } else {
                    ps = false;
                  }
                  if (!ps || !er) {
                    ps = false;
                    sendNow(cache.defKey, rq, rs, evaluate(rq, rs, cache, methods, vl2), 400);
                  }
                } else {
                  ps = false;
                  sendNow(cache.defKey, rq, rs, evaluate(rq, rs, cache, methods, vl2), 400);
                }
                return ps;
              };
              var bth = function(vls, ps) {
                if (typeof vls.eval === 'string' && vls.eval) {
                  ps = ps && ch(vls.eval, vls.ifFailed, ps);
                }
                if (typeof vls['@'] === 'string' && typeof methods[vls['@']] === 'function') {
                  ps = ps && ch(vls, vls.ifFailed, ps);
                }
                return ps;
              };
              if (typeof vl[n].once === 'string') {
                rq.once(vl[n].once, bth.bind(null, vl[n], pass));
                continue;
              } else {
                if (bth(vl[n], pass) === false) {
                  return 0;
                }
              }
            }
          }
          break;
        default:
          if (typeof vl === 'object' && ky.indexOf('$') === -1) {
            var vr = ky.charAt(0) === ':';
            if (vr) {
              ky = ky.substring(1);
            }
            if (IS_ALPHA_NUM(ky)) {
              if (vr) {
                res['$'] = ky
              }
              res[ky] = vl;
            }
          }
          break;
      }
    }
    var kys = Object.keys(res);
    if (kys.length) {
      if (res.hasOwnProperty('$')) {
        return [res, kys, res['$']];
      } else {
        return [res, kys];
      }
    }
    return false;
  };

  function evaluate(req, res, cache, methods, obj, next) {
    var isAsync = typeof next === 'function',
      isFunc = false,
      pms = [];
    if (typeof obj['@'] === 'string') {
      isFunc = obj['@'];
      if (typeof methods[isFunc] !== 'function') {
        isFunc = GLOBAL_METHODS.replace(obj['@'], cache, methods);
      }
      if (typeof methods[isFunc] === 'function') {
        if (obj['params'] === undefined) {
          obj['params'] = [];
        } else if (!(Array.isArray(obj['params']))) {
          obj['params'] = [obj['params']];
        }
        pms = GLOBAL_METHODS.assign(false, obj['params']);
        pms.unshift(res);
        pms.unshift(req);
      } else {
        isFunc = false;
      }
    }
    if (isAsync) {
      methods.async = function() {
        return next;
      };
    }
    if (typeof isFunc !== 'string' || !isFunc) {
      isFunc = false;
    }
    if (isAsync) {
      if (isFunc) {
        pms.push({
          '@': 'async'
        });
        GLOBAL_METHODS.replace({
          '@': isFunc,
          'params': pms
        }, cache, methods);
      } else {
        obj = GLOBAL_METHODS.assign({}, obj);
        next(GLOBAL_METHODS.replace(obj, cache, methods));
      }
    } else {
      var ob;
      if (isFunc) {
        ob = {
          '@': isFunc,
          'params': pms
        };
        ob = GLOBAL_METHODS.replace(ob, cache, methods);
      } else {
        if (typeof obj === 'object' && obj !== null) {
          ob = GLOBAL_METHODS.assign({}, obj);
        } else {
          ob = obj;
        }
        ob = GLOBAL_METHODS.replace(ob, cache, methods);
      }
      return ob;
    }
  }

  function sendNow(defKey, req, res, val, st) {
    if (val === undefined || val === null) {
      val = 'SUCCESS';
    }
    if (typeof val !== 'object') {
      var nw = {};
      if (typeof val === 'number' && val > 99 && val < 600) {
        nw.status = parseInt(val);
        val = (st === undefined) ? 'SUCCESS' : st;
      }
      nw[defKey] = val;
      val = nw;
    }
    res.statusCode = val.status || st || 200;
    delete val.status;
    var vl = res.exitGate(val);
    if (vl !== undefined) {
      val = vl;
    }
    res.end(GLOBAL_METHODS.stringify(val));
  }

  function resp(method, curr, req, res, cache, methods) {
    var next = sendNow.bind(null, cache.defKey, req, res);
    var evaling = function(ml) {
      var af = function(dt, num, noev) {
        var nxt = next;
        if (!noev && typeof ml.on === 'string') {
          evaluate(req, res, cache, methods, ml.on).split(',').forEach(function(ev) {
            ev = ev.trim();
            if (ev.length) {
              req.on(ev, af.bind(null, dt, num, true));
            }
          });
        }
        cache.currentData = dt;
        if (typeof num === 'number') {
          nxt = next.bind(null, num);
        }
        return evaluate(req, res, cache, methods, ml, nxt);
      };
      if (ml && typeof ml.once === 'string') {
        req.once(ml.once, af);
      } else {
        if (ml.from !== undefined) {
          fromSource(evaluate(req, res, cache, methods, ml.from), function(er, data) {
            if (er || !data) {
              af(er || 'Record not found.', 400);
            } else {
              af(data);
            }
          });
        } else
          return af();
      }
    };
    var notFoundCode = '404';
    if (['$', '>', 'GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'].indexOf(method) !== -1) {
      if (typeof cache.timeout === 'number') {
        setTimeout(function() {
          next(evaling(cache.errors['408']));
        }, cache.timeout);
      }
      switch (method) {
        case '$':
          if (curr) return evaling(curr);
          else break;
        case 'GET':
          var nw = curr['$'] || curr['$get'];
          if (nw) {
            var kn = nw['$>'];
            if (kn) kn = evaluate(req, res, cache, methods, kn);
            if (typeof kn === 'string' && curr[kn]) {
              return window.topath((req.parsedUrl.pathname.length > 1 ? req.parsedUrl.pathname : '') + '/' + kn);
            } else {
              return evaling(nw);
            }
          } else {
            break;
          }
        case '>':
          if (curr['>']) {
            var nw = curr['>'];
            var fe = GLOBAL_METHODS.lastValue(nw, 'forEach', '@');
            if (nw.from !== undefined && typeof fe === 'string' && typeof methods[fe] === 'function') {
              fromSource(evaluate(req, res, cache, methods, nw.from), function(er, data) {
                if (er || !(Array.isArray(data)) || !(data.length)) {
                  next(er || 'No records found.', 400);
                } else {
                  if (typeof nw.storeAs === 'string') {
                    window.GlobalStore.set(nw.storeAs, data);
                  }
                  var ln = data.length;

                  function forOne(data, z, as) {
                    methods[fe](cache, methods, req, res, data, z, next.bind(null, as));
                  }
                  var evs = nw.forEach.on;
                  var reg = function() {};
                  if (typeof evs === 'string' && evs) {
                    reg = function(data, z) {
                      var idk = cache.idKey || 'id';
                      evs.split(',').forEach(function(ev) {
                        ev = ev.trim();
                        if (ev.length) {
                          req.on(ev.replace('{{id}}', data[idk]), forOne.bind(null, data, z, 202));
                        }
                      });
                    };
                  }
                  for (var z = 0; z < ln; z++) {
                    reg(data[z], z);
                    forOne(data[z], z, 201);
                  }
                }
              });
              return next('Loading ..');
            }
            return evaling(curr['>']);
          }
          break;
      }
      notFoundCode = '405';
    }
    next(evaling(cache.errors[notFoundCode]));
  }

  function handler(req, res) {
    var parsed = req.parsedUrl,
      curr, vl, notFound = false;
    var paths = parsed.pathname.substring(1).split('/'),
      pl = paths.length;
    req['$W_END'] = true;
    res['$W_END'] = true;
    var cache = getNewVars(),
      methods = {};
    req.once('respondNow', function(vlm, st) {
      sendNow(cache.defKey, req, res, evaluate(req, res, cache, methods, vlm), st);
    });
    methods = GLOBAL_METHODS;
    curr = forOneObj(req, res, cache, methods, GLOBAL_API._root), vl = GLOBAL_API._root;
    var exitGate = GLOBAL_METHODS.lastValue(GLOBAL_API._root, '_methods', 'exitGate');
    res.exitGate = exitGate === 'function' ? exitGate.bind(res, cache, methods, req, res) : function() {};
    var method = req.method,
      notFound = GLOBAL_METHODS.lastValue.apply(undefined, [GLOBAL_APP_CONFIG].concat(paths.concat(['enable']))) === false;
    if (paths[0] !== '' && !(notFound)) {
      for (var prk, z = 0; z < pl; z++) {
        prk = paths[z];
        if (curr) {
          if (prk === '') {
            method = '>';
            break;
          } else if (curr[1].indexOf(prk) !== -1) {
            vl = curr[0][prk];
          } else if (curr[2]) {
            cache.params.path[curr[2]] = prk;
            prk = curr[2];
            vl = curr[0][prk];
          } else {
            notFound = true;
            break;
          }
          curr = forOneObj(req, res, cache, methods, vl);
          if (curr === 0) {
            return;
          } else if (req.notFound === true) {
            curr = false;
            notFound = true;
            break;
          }
        } else {
          notFound = true;
          break;
        }
      }
    }
    var nf = true,
      vlk = Object.keys(vl),
      vlkl = vlk.length;
    for (var z = 0; z < vlkl; z++) {
      if (vlk[z].charAt(0) === '$') {
        nf = false;
        break;
      }
    }
    req.pathFound = notFound;
    req.methodFound = nf;
    notFound = nf = false;
    resp(((notFound || nf) ? false : method), vl, req, res, cache, methods);
  };

  return handler;
});
GLOBAL_METHODS.appendHtml = (function() {
  function func(el, str) {
    var last = null,
      div = document.createElement('div');
    div.innerHTML = str;
    while (div.children.length > 0) {
      last = el.appendChild(div.children[0]);
    }
    return last;
  }

  return func;
});
GLOBAL_METHODS.eventer = (function() {
  function func() {
    function EventEmitter() {
      this.events = {};
    }

    EventEmitter.prototype.on = function(event, listener) {
      if (typeof this.events[event] !== 'object') {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    };

    EventEmitter.prototype.removeListener = function(event, listener) {
      var idx;
      if (typeof this.events[event] === 'object') {
        idx = this.events[event].indexOf(listener);
        if (idx > -1) {
          this.events[event].splice(idx, 1);
        }
      }
    };

    EventEmitter.prototype.emit = function(event) {
      var i, listeners, length, args = [].slice.call(arguments, 1);

      if (typeof this.events[event] === 'object') {
        listeners = this.events[event].slice();
        length = listeners.length;

        for (i = 0; i < length; i++) {
          listeners[i].apply(this, args);
        }
      }
    };

    EventEmitter.prototype.once = function(event, listener) {
      this.on(event, function g() {
        this.removeListener(event, g);
        listener.apply(this, arguments);
      });
    };

    return new EventEmitter();
  }

  return func;
});
GLOBAL_METHODS.hideAllChildren = (function() {
  function func(el) {
    var itemDivs = el.children,
      n = itemDivs.length;
    for (var i = 0; i < n; i++) {
      itemDivs[i].style.display = 'none';
    }
  }

  return func;
});
GLOBAL_METHODS.request = (function() {
  function isObect(ob) {
    return typeof ob === 'object' && ob !== null && !(Array.isArray(ob));
  }

  function func(options, cb) {
    var url, method, payload, headers, toParse;
    if (typeof cb !== 'function') {
      cb = function() {};
    }
    if (typeof options === 'string') {
      url = options;
      method = 'GET';
      toParse = JSON.stringify;
    } else if (isObect(options)) {
      url = options.url;
      method = options.method;
      payload = options.payload;
      headers = options.headers;
      toParse = options.toParse;
    } else {
      return cb('INVALID_OPTIONS');
    }
    if (typeof url !== 'string' || !url.length) {
      return cb('URL_NOT_FOUND');
    }
    if (typeof method !== 'string' || !method.length) {
      return cb('METHOD_NOT_FOUND');
    }
    var httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      return cb('XMLHTTP_NOT_AVAILABLE');
    }
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        var toSend = {
          statusCode: httpRequest.status,
          content: httpRequest.responseText,
        };
        if (httpRequest.responseXML) {
          toSend.parsed = httpRequest.responseXML;
        } else if (typeof toParse === 'function') {
          try {
            toSend.parsed = toParse(httpRequest.responseText);
          } catch (er) {
            toSend.parseError = er;
          }
        }
        cb(null, toSend);
      }
    }
    httpRequest.open(method, url, true);
    if (isObect(options.headers)) {
      for (var ky in options.headers) {
        if (typeof options.headers[ky] === 'string') {
          httpRequest.setRequestHeader(ky, options.headers[ky]);
        }
      }
    }
    if (typeof payload !== undefined) {
      payload = GLOBAL_METHODS.stirngify(payload);
      httpRequest.send(payload);
    } else {
      httpRequest.send();
    }
  }

  return func;
});
GLOBAL_METHODS.store = (function() {
  function func() {
    function Store() {
      this.db = {};
    }
    Store.prototype.set = function(name, arr) {
      this.db[name] = arr;
    }
    Store.prototype.get = function(name) {
      return this.db[name];
    }
    Store.prototype.setOne = function(name, id, data) {}
    Store.prototype.getOne = function(name, id) {}
    return new Store();
  }

  return func;
});
const N_REG = MAIN_MODULES._methods.isAlphaNum();
var mes = Object.keys(MAIN_MODULES._methods);
mes.forEach(function(ms) {
  FILE_STR += 'GLOBAL_METHODS.' + ms + ' = (' + String(MAIN_MODULES._methods[ms]) + ')();';
  GLOBAL_METHODS[ms] = GLOBAL_METHODS[ms]();
});
var ASSIGN = GLOBAL_METHODS.assign;
var REPL = GLOBAL_METHODS.replace;

ASSIGN(GLOBAL_API._vars, MAINS._vars, true);
ASSIGN(GLOBAL_API._vars.locale.en, MAINS._vars.locale.en);
if (typeof MAINS._root === 'object' && MAINS._root) {
  ASSIGN(GLOBAL_API._root, MAINS._root, true);
  ASSIGN(GLOBAL_API._root.$, MAINS._root.$);
}

REPL(GLOBAL_API, GLOBAL_API._vars);

FILE_STR += 'const GLOBAL_VARS = ' + JSON.stringify(GLOBAL_API._vars) + ';';
var GLOBAL_VARS = GLOBAL_API._vars;
delete GLOBAL_API._vars;
FILE_STR += 'GLOBAL_API = ' + JSON.stringify(GLOBAL_API) + ';';

function readOrAvoid(pth) {
  try {
    return GLOBAL_METHODS.replace((fs.readFileSync(pth).toString()).split('\n').join(''), GLOBAL_VARS);
  } catch (lm) {
    return ''
  }
}

var forOneModule = function(bs) {
  var mods = [];
  var pths = [process.cwd()];
  if (!(Array.isArray(bs))) bs = [];
  pths = pths.concat(bs);
  try {
    mods = fs.readdirSync(path.join.apply(path, pths.concat(['_methods']))).filter(N_REG);
  } catch (erm) {}
  var bsp = bs.length ? ('.' + (bs.join('.').replace('\/', '.'))) : '';
  if (bsp) {
    FILE_STR += 'if(!(GLOBAL_API._root' + bsp + ')){GLOBAL_API._root' + bsp + '={};}';
    FILE_STR += 'GLOBAL_API._root' + bsp + '._methods={};';
  } else {
    FILE_STR += 'GLOBAL_API._root._methods={};';
  }
  mods.forEach(function(ms) {
    FILE_STR += 'GLOBAL_API._root' + bsp + '._methods' + '.' + ms + ' = ' +
      (process.env.KEEP_STRUCTURE ?
        ('require(\'./' + pths.slice(1).concat(['_methods', ms]).join('/') + '\');') :
        ('(function(){' + fs.readFileSync(path.join.apply(path, pths.concat(['_methods', ms, 'index.js'])))
          .toString().replace('\'\';//READ_FROM_HTML', "'" +
            readOrAvoid(path.join.apply(path, pths.concat(['_methods', ms, 'index.html']))) + "';"
          )
          .replace('module.exports =', 'return') + '})();'));
  });
  var ms = [];
  try {
    ms = fs.readdirSync(path.join.apply(path, pths)).filter(N_REG);
  } catch (erm) {
    return;
  }
  pths.shift();
  ms.forEach(function(ms) {
    forOneModule(pths.concat([ms]));
  });
};

forOneModule();

FILE_STR += '(' + MAIN_MODULES._mains.server + ')()((' + MAIN_MODULES._mains.handler + ')());';

fs.writeFile(path.join(process.cwd(), SERVER_FILE_NAME), FILE_STR, function(err) {
  if (err) throw err;
  process.exit(0);
});