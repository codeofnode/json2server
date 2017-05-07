
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(el, str) {
    var last = null, div = document.createElement('div');
    div.innerHTML = str;
    while (div.children.length > 0) {
      last = el.appendChild(div.children[0]);
    }
    return last;
  }

  return func;
}
