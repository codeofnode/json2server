
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  var baseTypes = ['string','number','boolean','undefined'];

  function func(ab,bb,noob){
    if(typeof ab !== 'object' || !ab) ab = Array.isArray(bb) ? new Array(bb.length) : {};
    if(typeof bb === 'object' && bb){
      var kys = Object.keys(bb), kl = kys.length;
      for(var j =0; j< kl; j++){
        if(noob !== true || (baseTypes.indexOf(typeof ab[kys[j]]) !== -1) ||
            (baseTypes.indexOf(typeof bb[kys[j]]) !== -1)){
          ab[kys[j]] = bb[kys[j]];
        }
      }
    }
    return ab;
  }

  function main(){
    var ln = arguments.length, noob = arguments[ln-1];
    if(noob === true){ ln--; }
    else noob = false;
    var no = func(arguments[0],arguments[1],noob);
    for(var j =2;j<ln;j++){
      func(no,arguments[j],noob);
    }
    return no;
  }

  return main;
}
