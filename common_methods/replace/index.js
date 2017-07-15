
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  if (typeof GLOBAL_APP_CONFIG !== 'object' || GLOBAL_APP_CONFIG === null) GLOBAL_APP_CONFIG = {};

  const START_VAR = GLOBAL_APP_CONFIG.startvar || '{{',
        END_VAR =  GLOBAL_APP_CONFIG.endvar || '}}',
        SVAR_L = START_VAR.length, EVAR_L = END_VAR.length,
        NOT_FOUND_MSG = GLOBAL_APP_CONFIG.notfoundvalue || 'VAR_NOT_FOUND',
        FUNC_KEY = GLOBAL_APP_CONFIG.functionkey || '@',
        VAR_REG = GLOBAL_APP_CONFIG.variableregex || /(\{\{[a-zA-Z0-9\$\.\_]+\}\})+/g;

  const WALK_INTO = GLOBAL_METHODS.objwalk,
        IS_ALPHA_NUM = GLOBAL_METHODS.isAlphaNum,
        ASSIGN = GLOBAL_METHODS.assign;

  function isWithVars(st){
    if(st && typeof st === 'string' && st.length > (END_VAR.length+START_VAR.length)) {
      var f = st.indexOf(START_VAR), l = st.indexOf(END_VAR);
      return (f !== -1 && l !== -1) ? [f,l] : false;
    } else return false;
  }

  function _noUndefined(st, def){
    return st === undefined ? def : st;
  }

  function getVarVal(varVal, varName, variablesMap){
    if(typeof variablesMap !== 'object' || !variablesMap){
      return varVal;
    }
    if(varName.indexOf('.') !== -1){
      var spls = varName.split('.'), ln = spls.length, valFound = true;
      if(ln){
        var base = getVarVal(spls[0], spls[0], variablesMap), curVal;
        for(var j = 1; j < ln; j++){
          if(spls[j].length){
            if(typeof base === 'object'){
              curVal = replace(spls[j], variablesMap);
              try {
                base = base[curVal];
              } catch(erm) {
                valFound = false;
              }
            } else {
              valFound = false;
            }
          }
        }
        if(valFound){
          return _noUndefined(base,varVal);
        }
      }
    }
    return variablesMap.hasOwnProperty(varName) ? variablesMap[varName] : _noUndefined(varVal);
  }

  function extractVars(str){
    return str.match(VAR_REG) || [];
  }

  function extractVarName(variable){
    return variable.substring(SVAR_L, variable.length - EVAR_L);
  }

  function _replace(st,vars){
    var replaced, varName, nvars = extractVars(st), reRep = false;
    for(var i = 0; i < nvars.length; i++){
      varName = extractVarName(nvars[i]);
      replaced = getVarVal(nvars[i], varName, vars);
      if(st === nvars[i]) return replaced;
      var rValue = (typeof replaced === 'string') ? replaced : JSON.stringify(replaced);
      st = st.replace(nvars[i], function(){ return rValue; });
    }
    return st;
  }

  function replace(st,vars,ins){
    if(typeof st === 'string'){
      if(typeof vars !== 'object' || !vars){
        return st;
      }
      if(!(Array.isArray(ins))){
        ins = isWithVars(st);
      }
      if(!(ins)) {
        return st;
      }
      var reRep = (st.indexOf('.'+START_VAR) !== -1) && (st.indexOf(END_VAR+'.') !== -1);
      st = _replace(st,vars);
      if(reRep){
        st = _replace(st,vars);
      }
    }
    return st;
  }

  function handleFunction(inp,vars,methods){
    if(typeof inp === 'object' && inp) {
      if(typeof methods === 'object' && (typeof inp[FUNC_KEY] === 'string') &&
          IS_ALPHA_NUM(inp[FUNC_KEY]) && (typeof methods[inp[FUNC_KEY]] === 'function')){
        var pms = (typeof inp.params === 'object' && inp.params !== null) ? ASSIGN(false,inp.params) : inp.params;
        var params = deepReplace(pms,vars,methods);
        if(!(Array.isArray(params))){
          params = [params];
        }
        params.unshift(vars,methods);
        return methods[inp[FUNC_KEY]].apply(null, params);
      }
    }
    return inp;
  }

  function deepReplace(input,vars,methods){
    if(typeof input !== 'object' || !input){
      return replace(input, vars);
    }
    input = handleFunction(input,vars,methods);
    WALK_INTO(function(valn, key, rt){
      if(typeof rt === 'object' && rt && typeof rt.hasOwnProperty === 'function' && rt.hasOwnProperty(key)){
        var val = rt[key], tmpKy = null, isth = isWithVars(key);
        if(isth){
          tmpKy = replace(key, vars, isth);
          if(tmpKy !== key){
            val = rt[tmpKy] = rt[key];
            delete rt[key];
          }
        }
        if(typeof val === 'string' && val){
          isth = isWithVars(val);
          if(isth){
            rt[tmpKy || key] = replace(val, vars, isth);
          }
        } else {
          rt[tmpKy || key] = handleFunction(val,vars,methods);
        }
      }
    }, null, input);
    return input;
  }

  return deepReplace;
}
