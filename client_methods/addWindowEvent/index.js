
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function addEvent(func,on) {
    if(typeof on !== 'string') on = 'onload';
    var oldonload = window[on];
    if (typeof window[on] != 'function') {
      window[on] = func;
    } else {
      window[on] = function() {
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
