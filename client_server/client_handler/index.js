module.exports = function(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  function IsValidPathKey(st){
    return Boolean(!(/[^\-_A-Za-z0-9]/).test(st));
  }

  var IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum;
  var S_VARS = GLOBAL_VARS;

  function fromSource(src, after) {
    if (typeof src === 'string') {
      GLOBAL_METHODS.request(src, function(er, obj) {
        if (er) after(er.parsed || er);
        else after(null, obj.parsed);
      });
    } else {
      if (!Array.isArray(src)) {
        src = [src];
      }
      after(null, src);
    }
  }

  function getNewVars() {
    var rvars = S_VARS;
    if (typeof rvars.params !== 'object' || rvars.params === null) rvars.params = {};
    if (typeof rvars.params.path !== 'object' || rvars.params.path === null) rvars.params.path = {};
    if (typeof rvars.params.query !== 'object' || rvars.params.query === null) rvars.params.query = {};
    if (typeof rvars.params.body !== 'object' || rvars.params.body === null) rvars.params.body = {};
    if (typeof rvars.params.header !== 'object' || rvars.params.header === null) rvars.params.header = {};
    if (!(Array.isArray(rvars.params.file))) rvars.params.file = [];
    return rvars;
  }

  function register(ob, req, ev, call, modev) {
    if (typeof ev !== 'string') return;
    ev = ev.trim();
    if (!ev.length) return;
    if (typeof modev === 'function') ev = modev(ev);
    if (!(ob['/'])) {
      req.on(ev, call);
      ob['/'] = true;
    }
  }

  var onceOrParsed = function(req, rvars, pre, func) {
    if (req.uponParse || (typeof pre === 'string')) {
      req.once(typeof pre === 'string' ? pre : 'body-parsed', func);
      return true;
    } else {
      return false;
    }
  };

  var parseRequestPayload = function(req, method, methods, rvars) {
    if (PARSEABLE.indexOf(method) === -1) return;
    req.uponParse = true;
    methods.parsePayload(rvars.params, req);
  };

  var forOneObj = function(rq, rs, rvars, methods, ob, ks) {
    if (!ob) return false;
    GLOBAL_METHODS.assign(rvars, ob._vars);
    GLOBAL_METHODS.assign(methods, ob._methods);
    var kys = (ks || Object.keys(ob).sort()),
      kl = kys.length;
    var res = {};
    for (var ky, vl, z = 0; z < kl; z++) {
      ky = kys[z];
      vl = ob[ky];
      if (vl === undefined) continue;
      switch (ky) {
        case '*':
          if (String(GLOBAL_METHODS.replace(vl, rvars, methods) === 'false')) {
            rq.notFound = true;
          }
          break;
        case '+':
          var pluskeys = Object.keys(vl),
            pl = pluskeys.length;

          function cl(ky, dt, ifv) {
            if (ifv === undefined || doEval(rq, rs, rvars, methods, ifv)) {
              if (ky.charAt(0) === '#') {
                var el = document.getElementById(ky.substring(1));
                return evaluate(rq, rs, rvars, methods, dt, function(str) {
                  if (el) {
                    el.innerHTML = str;
                  }
                }, el);
              }
              rvars[ky] = evaluate(rq, rs, rvars, methods, dt);
            }
          }
          for (var n = 0; n < pl; n++) {
            cl(pluskeys[n], vl[pluskeys[n]], vl[pluskeys[n]].if);
            if (typeof vl[pluskeys[n]].on === 'string' && vl[pluskeys[n]].on.length) {
              evaluate(rq, rs, rvars, methods, vl[pluskeys[n]].on).split(',').forEach(function(ev) {
                register(vl[pluskeys[n]], rq, ev, cl.bind(null, pluskeys[n], vl[pluskeys[n]], vl[pluskeys[n]].if));
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
                if (!vl2) vl2 = getErrorWithStatusCode(rvars, 'inval');
                if (ps) {
                  var er = doEval(rq, rs, rvars, methods, vl1) !== false;
                  if (!ps || !er) {
                    ps = false;
                    sendNow(rvars.defKey, rq, rs, evaluate(rq, rs, rvars, methods, vl2), 400);
                  }
                } else {
                  ps = false;
                  sendNow(rvars.defKey, rq, rs, evaluate(rq, rs, rvars, methods, vl2), 400);
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
              if (onceOrParsed(rq, rvars, vl[n].once, bth.bind(null, vl[n], pass))) {
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
            if (IS_ALPHA_NUM(ky.charAt(0)) && IsValidPathKey(ky)) {
              if (vr) {
                res['$'] = ky;
                GLOBAL_METHODS.assign(ob[':' + ky], ob[ky]);
                delete ob[ky];
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

  function doEval(req, res, rvars, methods, obj, bool, nocall) {
    var ret = obj,
      valn = evaluate(req, res, rvars, methods, ret);
    if (typeof ret === 'string' && nocall !== true) {
      if (typeof valn === 'string' && valn.indexOf('{{') !== -1 && valn.indexOf('}}') !== -1) {
        return false;
      }
      return Boolean(valn);
    }
    if (GLOBAL_APP_CONFIG.evalenabled !== false) {
      try {
        ret = eval(nocall ? obj : valn);
      } catch (erm) {
        if (bool) return false;
      }
    } else {
      ret = valn
    }
    return bool ? Boolean(ret) : ret;
  }

  function rectify(obj, rvars, methods) {
    var ob;
    if (typeof obj === 'object' && obj !== null) {
      ob = GLOBAL_METHODS.assign(undefined, obj);
    } else {
      ob = obj;
    }
    ob = GLOBAL_METHODS.replace(ob, rvars, methods);
    return ob;
  }

  function getErrorWithStatusCode(rvars, key, statusCode) {
    var snd = GLOBAL_METHODS.lastValue(rvars, 'errors', key);
    if (!snd) {
      snd = {};
      var defKey = rvars.defKey || '_';
      switch (statusCode || key) {
        case '405':
          snd[defKey] = 'METHOD_NOT_FOUND';
          snd.status = 405;
          break;
        case '404':
          snd[defKey] = 'ROUTE_NOT_FOUND';
          snd.status = 404;
          break;
        case '408':
          snd[defKey] = 'TIMEOUT';
          snd.status = 408;
          break;
        default:
          snd[defKey] = 'INVALID_INPUT';
          snd.status = 400;
      }
    }
    return snd;
  }

  function evaluate(req, res, rvars, methods, obj, next) {
    var isAsync = typeof next === 'function',
      isFunc = false,
      pms = [];
    if (obj && typeof obj['@'] === 'string') {
      isFunc = obj['@'];
      if (typeof methods[isFunc] !== 'function') {
        isFunc = GLOBAL_METHODS.replace(obj['@'], rvars, methods);
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
    } else if (typeof obj === 'object' && obj['#val'] !== undefined) {
      obj = obj['#val'];
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
        }, rvars, methods);
      } else {
        next(rectify(obj, rvars, methods));
      }
    } else {
      var ob;
      if (isFunc) {
        ob = {
          '@': isFunc,
          'params': pms
        };
        ob = GLOBAL_METHODS.replace(ob, rvars, methods);
      } else {
        ob = rectify(obj, rvars, methods);
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
      nw[defKey || '_'] = val;
      val = nw;
    }
    res.statusCode = val.status || st || 200;
    delete val.status;
    var vl = res.exitGate(val);
    if (vl !== undefined) {
      val = vl;
    }
    res.end(val);
  }

  function resp(method, curr, req, res, rvars, methods) {
    var next = sendNow.bind(null, rvars.defKey, req, res);
    var evaling = function(ml) {
      var af = function(dt, num, noev) {
        var nxt = next;
        if (dt !== undefined) rvars.currentData = dt;
        if (!noev && typeof ml.on === 'string') {
          evaluate(req, res, rvars, methods, ml.on).split(',').forEach(function(ev) {
            register(ml, req, ev, af.bind(null, dt, num, true));
          });
        }
        if (typeof num === 'number') {
          nxt = next.bind(null, num);
        }
        return evaluate(req, res, rvars, methods, ml, nxt);
      };
      var afterFrom = function() {
        forOneObj(req, res, rvars, methods, ml, ['+', '=']);
        if (ml.from !== undefined) {
          var directRespond = !(ml['@']);
          fromSource(evaluate(req, res, rvars, methods, ml.from), function(er, data) {
            if (directRespond) {
              next(evaluate(req, res, rvars, methods, er || data), er ? 400 : 200);
            } else if (er || !data) {
              af(er || 'Record not found.', 400);
            } else {
              af(data);
            }
          });
        } else {
          return af();
        }
      };
      if (method === false && curr === false) {
        return next('Request could not be parsed. Special characters in request path are not allowed.', 400);
      } else if (!(onceOrParsed(req, rvars, (ml && ml.once), afterFrom))) {
        return afterFrom();
      }
    };
    var notFoundCode = '404';
    if (['$', '>', 'GET'].indexOf(method) !== -1) {
      if (typeof rvars.timeout === 'number') {
        setTimeout(function() {
          evaling(getErrorWithStatusCode(rvars, '408'));
        }, rvars.timeout);
      }
      switch (method) {
        case '$':
          if (curr) return evaling(curr);
          else break;
        case 'GET':
          var nw = curr['$'] || curr['$get'];
          if (nw) {
            var isAny = false,
              kn = nw['$>'];
            if (kn) {
              kn = evaluate(req, res, rvars, methods, kn);
              isAny = (Object.keys(curr).filter(function(ab) {
                return ab.charAt(0) === ':';
              }).length > 0);
            }
            if (typeof kn === 'string' && (curr[kn] || isAny)) {
              return GLOBAL_METHODS.topath((req.parsedUrl.pathname.length > 1 ? req.parsedUrl.pathname : '') + '/' + kn);
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
              fromSource(evaluate(req, res, rvars, methods, nw.from), function(er, data) {
                if (er || !(Array.isArray(data)) || !(data.length)) {
                  next(er || 'No records found.', 400);
                } else {
                  var ln = data.length;

                  function forOne(data, z, as) {
                    methods[fe](rvars, methods, req, res, data, z, next.bind(null, as));
                  }
                  var evs = nw.forEach.on;
                  var reg = function() {};
                  if (typeof evs === 'string' && evs) {
                    reg = function(data, z) {
                      var idk = rvars.idKey || 'id';
                      evs.split(',').forEach(function(ev) {
                        register(nw.forEach, req, ev, forOne.bind(null, data, z, 202), function(ev) {
                          return ev.replace('{{id}}', data[idk]);
                        });
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
    evaling(getErrorWithStatusCode(rvars, notFoundCode));
  }


  function handler(req, res) {
    req['$W_END'] = true;
    res['$W_END'] = true;
    var parsed = req.parsedUrl,
      curr, vl, notFound = false,
      pthn = parsed.pathname || '';
    var rvars = getNewVars(),
      methods = {};
    rvars.params.query = parsed.query;
    methods = GLOBAL_METHODS;
    var entryGate = GLOBAL_METHODS.lastValue(GLOBAL_API.root, '_methods', 'entryGate');

    function afterEntry() {
      var exitGate = GLOBAL_METHODS.lastValue(GLOBAL_API.root, '_methods', 'exitGate');
      res.exitGate = typeof exitGate === 'function' ? exitGate.bind(res, rvars, methods, req, res) : function() {};
      if (typeof GLOBAL_APP_CONFIG.mountpath === 'string') {
        if (pthn.indexOf(GLOBAL_APP_CONFIG.mountpath) !== 0) {
          return resp(false, curr, req, res, rvars, methods);
        } else {
          pthn = GLOBAL_METHODS.resolveSlash(pthn.substring(GLOBAL_APP_CONFIG.mountpath.length));
        }
      }
      var paths = pthn.substring(1).split('/'),
        pl = paths.length;
      req.once('respondNow', function(vlm, st) {
        sendNow(rvars.defKey, req, res, evaluate(req, res, rvars, methods, vlm), st);
      });
      curr = forOneObj(req, res, rvars, methods, GLOBAL_API.root), vl = GLOBAL_API.root;
      var method = req.method,
        notFound = GLOBAL_METHODS.lastValue.apply(undefined, [GLOBAL_APP_CONFIG].concat(paths.concat(['enable']))) === false;
      if (paths[0] === '') {} else if (!(notFound)) {
        for (var prk, z = 0; z < pl; z++) {
          prk = paths[z];
          if (prk === '') {
            method = '>';
            break;
          }
          if (curr) {
            if (curr[1].indexOf(prk) !== -1) {
              vl = curr[0][prk];
            } else if (curr[2]) {
              rvars.params.path[curr[2]] = prk;
              prk = curr[2];
              vl = curr[0][prk];
            } else {
              notFound = true;
              break;
            }
            curr = forOneObj(req, res, rvars, methods, vl);
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
        if (vlk[z].charAt(0) === '$' || vlk[z].charAt(0) === '>') {
          nf = false;
          break;
        }
      }
      req.pathFound = notFound;
      req.methodFound = nf;
      resp(((notFound || nf) ? false : method), vl, req, res, rvars, methods);
    }
    if (typeof entryGate === 'function') {
      var entryResp = entryGate(rvars, methods, req, res);
      if (entryResp) {
        if (entryResp instanceof Promise) {
          entryResp.then(afterEntry).catch(function(vlm) {
            sendNow(rvars.defKey, req, res, evaluate(req, res, rvars, methods, vlm), 503);
          });
        } else {
          sendNow(rvars.defKey, req, res, evaluate(req, res, rvars, methods, entryResp), 503);
        }
      } else {
        afterEntry();
      }
    } else {
      afterEntry();
    }
  };

  return handler;
}
