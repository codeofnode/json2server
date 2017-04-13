function func(CONFIG_PATH, API_PATH, APP_DIR_PATH) {
    const NodePath = require('path'),
        NodeFs = require('fs');
    var GLOBAL_METHODS = {},
        GLOBAL_APP_CONFIG = {},
        MAINS = {};
    if (!APP_DIR_PATH) APP_DIR_PATH = process.cwd();
    try {
        GLOBAL_APP_CONFIG = require(CONFIG_PATH || '../../config.json');
    } catch (erm) {
        console.log('WARNING : config.json not loaded.');
        console.log(erm);
    }
    try {
        MAINS = require(API_PATH || '../../api.json');
    } catch (erm) {
        console.log('WARNING : api.json not loaded.');
        console.log(erm);
    }

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
    })();
    GLOBAL_METHODS.isAlphaNum = (function() {
        function func(st) {
            return Boolean(!(/[^A-Za-z0-9]/).test(st));
        }

        return func;
    })();
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
    })();
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
    })();
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
    })();
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

        function _noUndefined(st) {
            return st;
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
                        return _noUndefined(base);
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
                var pms = ASSIGN(false, inp['params']);
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
    })();

    var GLOBAL_API = require('./defaults.json');

    var ASSIGN = GLOBAL_METHODS.assign;
    var REPL = GLOBAL_METHODS.replace;
    var lastValue = GLOBAL_METHODS.lastValue;
    var N_REG = GLOBAL_METHODS.isAlphaNum;

    ASSIGN(GLOBAL_API._vars, MAINS._vars, true);
    ASSIGN(GLOBAL_API._vars.locale.en, lastValue(MAINS, '_vars', 'locale', 'en'));
    if (typeof MAINS._root === 'object' && MAINS._root) {
        ASSIGN(GLOBAL_API._root, MAINS._root, true);
        ASSIGN(GLOBAL_API._root.$, MAINS._root.$);
    }

    REPL(GLOBAL_API, GLOBAL_API._vars);
    const GLOBAL_VARS = GLOBAL_API._vars;
    delete GLOBAL_API._vars;

    var forOneModule = function(bs) {
        var mods = [];
        var pths = [];
        if (!(Array.isArray(bs))) bs = [];
        pths = [APP_DIR_PATH].concat(bs);
        try {
            mods = NodeFs.readdirSync(NodePath.join.apply(NodePath, pths.concat(['_methods']))).filter(N_REG);
        } catch (erm) {}
        var cr = lastValue.apply(lastValue, [GLOBAL_API._root].concat(bs));
        if (cr) {
            if (!cr._methods) cr._methods = {};
            mods.forEach(function(ms) {
                cr._methods[ms] =
                    eval('(function(){' + NodeFs.readFileSync(NodePath.join.apply(NodePath, pths.concat(['_methods', ms, 'index.js'])))
                        .toString().replace('module.exports =', 'return') + '})();');
            });
        }
        var ms = [];
        try {
            ms = NodeFs.readdirSync(NodePath.join.apply(NodePath, pths)).filter(N_REG);
        } catch (erm) {
            return;
        }
        pths.shift();
        ms.forEach(function(ms) {
            forOneModule(pths.concat([ms]));
        });
    };

    forOneModule();

    var startServer = function(httpsConfig) {
        ((function() {
            function server(handler) {
                var isHttps = typeof httpsConfig === 'object' && httpsConfig,
                    mod = isHttps ? require('https') : require("http"),
                    port = process.env.PORT || GLOBAL_APP_CONFIG.port || 3000;

                var server = isHttps ? mod.createServer(httpsConfig, handler) : mod.createServer(handler);
                server.listen(parseInt(port, 10));

                console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
            };

            return server;
        }))()(((function() {
            const url = require('url'),
                S_VARS = JSON.stringify(GLOBAL_VARS),
                IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum;

            function getNewVars() {
                var cache = JSON.parse(S_VARS);
                if (typeof cache.params !== 'object' || cahce.params === null) cache.params = {};
                if (typeof cache.params.path !== 'object' || cahce.params.path === null) cache.params.path = {};
                if (typeof cache.params.query !== 'object' || cahce.params.query === null) cache.params.query = {};
                if (typeof cache.params.body !== 'object' || cahce.params.body === null) cache.params.body = {};
                if (!(Array.isArray(cache.params.file))) cache.params.file = [];
                return cache;
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
                            for (var n = 0; n < pl; n++) {
                                cache[pluskeys[n]] = evaluate(rq, rs, cache, methods, vl[pluskeys[n]]);
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

            function evaluate(req, res, cache, methods, obj, next) {
                if (res.responded) return;
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
                if (!(res.hasOwnProperty('responded'))) {
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
                    try {
                        val = JSON.stringify(val);
                    } catch (er) {
                        val = GLOBAL_METHODS.assign({}, val, true);
                        val.CIRCULAR_JSON_FOUND = 'HENCE_NO_OBJECT_VALUES';
                        val = JSON.stringify(val);
                    }
                    res.end(val);
                }
            };

            function resp(method, curr, req, res, cache, methods) {
                if (res.responded) return;
                var next = sendNow.bind(null, cache.defKey, req, res);
                var evaling = function(ml) {
                    var af = function() {
                        if (res.responded) return;
                        return evaluate(req, res, cache, methods, ml, next);
                    };
                    if (ml && typeof ml.once === 'string') {
                        req.once(ml.once, af);
                    } else {
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
                            if (curr['$'] || curr['$get']) return evaling((curr['$'] || curr['$get']));
                            else break;
                        case '>':
                            if (curr['>']) return evaling(curr['>']);
                            break;
                    }
                    notFoundCode = '405';
                }
                next(evaling(cache.errors[notFoundCode]));
            }

            function handler(req, res) {
                var parsed = url.parse(req.url),
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
                GLOBAL_METHODS.assign(methods, GLOBAL_METHODS);
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
                    if (vlk[z].charAt(0) === '$') {
                        nf = false;
                        break;
                    }
                }
                resp(((notFound || nf) ? false : method), vl, req, res, cache, methods);
            };

            return handler;
        }))());
    };

    return {
        api: GLOBAL_API,
        config: GLOBAL_APP_CONFIG,
        methods: GLOBAL_METHODS,
        start: startServer
    };
}

module.exports = func;