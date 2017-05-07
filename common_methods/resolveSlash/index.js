
module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(url,ls,rm){
    if(typeof url === 'string'){
      if(ls){
        if(rm){
          url = url.endsWith('/') ? url.slice(0,-1) : url
        } else {
          url = url.endsWith('/') ? url : (url + '/')
        }
      } else {
        if(rm){
          url = (url.charAt(0) === '/') ? url.slice(1) : url;
        } else {
          url = (url.charAt(0) === '/') ? url : ('/'+url);
        }
      }
    }
    return url;
  }

  return func;
}
