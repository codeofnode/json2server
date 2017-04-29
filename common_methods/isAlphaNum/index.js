
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  function func(st){
    return Boolean(!(/[^A-Za-z0-9]/).test(st));
  }

  return func;
}
