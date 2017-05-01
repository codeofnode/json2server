
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function addEvent(func,on) {
    if(typeof on !== 'string') on = 'onload';
    var oldonload = require[on];
    if (typeof require[on] != 'function') {
      require[on] = func;
    } else {
      require[on] = function() {
        if (oldonload) {
          oldonload();
        }
        if(typeof func === 'function'){
          func();
        }
      }
    }
  }

  return addEvent;
}
