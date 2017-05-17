
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  const START_VAR = '{{', END_VAR = '}}', SVAR_L = 2, EVAR_L = 2,
        NOT_FOUND_MSG = 'VAR_NOT_FOUND',
        VAR_REG = /(\{\{[a-zA-Z0-9\$\.\_]+\}\})+/g;

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
      if(typeof methods === 'object' && (typeof inp['@'] === 'string') &&
          IS_ALPHA_NUM(inp['@']) && (typeof methods[inp['@']] === 'function')){
        var pms = (typeof inp.params === 'object' && inp.params !== null) ? ASSIGN(false,inp.params) : inp.params;
        var params = deepReplace(pms,vars,methods);
        if(!(Array.isArray(params))){
          params = [params];
        }
        params.unshift(vars,methods);
        return methods[inp['@']].apply(null, params);
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
