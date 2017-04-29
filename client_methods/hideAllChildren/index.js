
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(el){
    var itemDivs = el.children, n = itemDivs.length;
    for(var i = 0; i < n; i++) {
      itemDivs[i].style.display = 'none';
    }
  }

  return func;
}
