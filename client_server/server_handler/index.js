module.exports = function(require, GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  const IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum;
  const S_VARS = JSON.stringify(GLOBAL_VARS);

  function fromSource(src, after) {
    if (typeof src === 'string' && src.indexOf('http') === 0) {
      GLOBAL_METHODS.request(src, function(er, obj) {
        if (er) after(er);
        else if (typeof obj.statusCode === 'number' && obj.statusCode > 199 && obj.statusCode < 300) {
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
    var cache = JSON.parse(S_VARS);
    if (typeof cache.params !== 'object' || cache.params === null) cache.params = {};
    if (typeof cache.params.path !== 'object' || cache.params.path === null) cache.params.path = {};
    if (typeof cache.params.query !== 'object' || cache.params.query === null) cache.params.query = {};
    if (typeof cache.params.body !== 'object' || cache.params.body === null) cache.params.body = {};
    if (typeof cache.params.header !== 'object' || cache.params.header === null) cache.params.header = {};
    if (!(Array.isArray(cache.params.file))) cache.params.file = [];
    return cache;
  }

  function register(ob, req, ev, call, modev) {
    if (typeof ev !== 'string') return;
    ev = ev.trim();
    if (!ev.length) return;
    if (typeof modev === 'function') ev = modev(ev);
    req.on(ev, call);
  }

  var forOneObj = function(rq, rs, cache, methods, ob) {
    if (rs.responded) return;
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
                register(vl[pluskeys[n]], rq, ev, cl.bind(null, pluskeys[n], vl[pluskeys[n]]));
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
                if (rs.responded) return;
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
                if (rs.responded) return;
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

  function rectify(obj, cache, methods) {
    var ob;
    if (typeof obj === 'object' && obj !== null) {
      ob = GLOBAL_METHODS.assign(undefined, obj);
    } else {
      ob = obj;
    }
    ob = GLOBAL_METHODS.replace(ob, cache, methods);
    return ob;
  }

  function evaluate(req, res, cache, methods, obj, next) {
    if (res.responded) return;
    var isAsync = typeof next === 'function',
      isFunc = false,
      pms = [];
    if (obj && typeof obj['@'] === 'string') {
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
        next(rectify(obj, cache, methods));
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
        ob = rectify(obj, cache, methods);
      }
      return ob;
    }
  }

  function sendNow(defKey, req, res, val, st) {
    if (res.hasOwnProperty('responded')) {
      return;
    }
    res.responded = true;
    req.removeAllListeners();
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
    res.setHeader('Content-Type', 'application/json');
    var vl = res.exitGate(val);
    if (vl !== undefined) {
      val = vl;
    }
    res.end(GLOBAL_METHODS.stringify(val));
  }

  function resp(method, curr, req, res, cache, methods) {
    if (res.responded) return;
    var next = sendNow.bind(null, cache.defKey, req, res);
    var evaling = function(ml) {
      var af = function(dt, num, noev) {
        var nxt = next;
        if (res.responded) return;
        cache.currentData = dt;
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
        } else {
          return af();
        }
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
        case 'POST':
          if (curr['$post']) return evaling(curr['$post']);
          else break;
        case 'PATCH':
          if (curr['$patch']) return evaling(curr['$patch']);
          else break;
        case 'PUT':
          if (curr['$put']) return evaling(curr['$put']);
          else break;
        case 'DELETE':
          if (curr['$delete']) return evaling(curr['$delete']);
          else break;
        case 'OPTIONS':
          if (curr['$options']) return evaling(curr['$options']);
          else break;
        case 'GET':
          var nw = curr['$'] || curr['$get'];
          if (nw) {
            var isAny = false,
              kn = nw['$>'];
            if (kn) {
              kn = evaluate(req, res, cache, methods, kn);
              isAny = (Object.keys(curr).filter(function(ab) {
                return ab.charAt(0) === ':';
              }).length > 0);
            }
            if (typeof kn === 'string' && (curr[kn] || isAny)) {
              return resp(method, curr[kn], req, res, cache, methods);
            } else {
              return evaling(nw);
            }
          } else {
            break;
          }
        case '>':
          if (curr['>']) {
            return evaling(curr['>']);
          }
          break;
      }
      notFoundCode = '405';
    }
    next(evaling(cache.errors[notFoundCode]));
  }

  const MIME_TYPE = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
  };
  var staticServer = false;
  const nodePath = require('path'),
    nodeFs = require('fs');

  function stServer(pth) {
    try {
      nodeFs.accessSync(pth, nodeFs.constants.R_OK);
    } catch (err) {
      console.log(' >>>> Static path not available for static server.');
      console.log(err);
      return;
    }
    this.staticDir = pth;
  }

  stServer.prototype.serve = function(req, res, cb) {
    var reqpath = req.url.toString().split('?')[0];
    if (req.method !== 'GET') {
      res.statusCode = 501;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Method not implemented');
    }
    var file = nodePath.join(this.staticDir, reqpath.replace(/\/$/, '/index.html'));
    if (file.indexOf(this.staticDir + nodePath.sep) !== 0) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Forbidden');
    }
    var type = MIME_TYPE[nodePath.extname(file).slice(1)] || 'text/plain';
    var st = nodeFs.createReadStream(file);
    st.on('open', function() {
      res.setHeader('Content-Type', type);
      st.pipe(res);
    });
    st.on('error', function() {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 404;
      res.end('Not found');
    });
  }

  if (typeof GLOBAL_APP_CONFIG.staticdir === 'string') {
    staticServer = new stServer(GLOBAL_APP_CONFIG.staticdir);
    if (!staticServer || !staticServer.staticDir) {
      staticServer = false;
    }
  }

  function serveStatic(req, res) {
    staticServer.serve(req, res);
  }

  function handler(req, res) {
    req['$W_END'] = true;
    res['$W_END'] = true;
    var parsed = req.parsedUrl,
      curr, vl, notFound = false,
      pthn = parsed.pathname;
    var cache = getNewVars(),
      methods = {};
    GLOBAL_METHODS.assign(methods, GLOBAL_METHODS);
    if (typeof GLOBAL_APP_CONFIG.mountpath === 'string') {
      if (pthn.indexOf(GLOBAL_APP_CONFIG.mountpath) !== 0) {
        return resp(false, curr, req, res, cache, methods);
      } else {
        pthn = GLOBAL_METHODS.resolveSlash(pthn.substring(GLOBAL_APP_CONFIG.mountpath.length));
      }
    }
    var paths = pthn.substring(1).split('/'),
      pl = paths.length;
    if (staticServer && paths[pl - 1].indexOf('.') !== -1) {
      return serveStatic(req, res);
    }
    req.once('respondNow', function(vlm, st) {
      sendNow(cache.defKey, req, res, evaluate(req, res, cache, methods, vlm), st);
    });
    curr = forOneObj(req, res, cache, methods, GLOBAL_API.root), vl = GLOBAL_API.root;
    var exitGate = GLOBAL_METHODS.lastValue(GLOBAL_API.root, '_methods', 'exitGate');
    res.exitGate = typeof exitGate === 'function' ? exitGate.bind(res, cache, methods, req, res) : function() {};
    var method = req.method,
      notFound = GLOBAL_METHODS.lastValue.apply(undefined, [GLOBAL_APP_CONFIG].concat(paths.concat(['enable']))) === false;
    if (paths[0] !== '' && !(notFound)) {
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
            cache.params.path[curr[2]] = prk;
            prk = curr[2];
            vl = curr[0][prk];
          } else {
            vl = false;
            notFound = true;
            break;
          }
          curr = forOneObj(req, res, cache, methods, vl);
          if (curr === 0) {
            return;
          } else if (req.notFound === true) {
            vl = false;
            curr = false;
            notFound = true;
            break;
          }
        } else {
          vl = false;
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
    resp(((notFound || nf) ? false : method), vl, req, res, cache, methods);
  };

  return handler;
}