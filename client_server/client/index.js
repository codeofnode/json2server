module.exports = function(GLOBAL_APP_CONFIG,GLOBAL_METHODS){
  var mainHandler = false;

  var MAIN_CONT_ID = GLOBAL_APP_CONFIG.mainContentBlockId || 'main-content-block';

  var ReqResMap = {
  };

  function getNewReqRes(idm){
    if(ReqResMap[idm]){
      return ReqResMap[idm];
    } else {
      ReqResMap[idm] = [new Request(), new Response()];
      return ReqResMap[idm];
    }
  }

  window.topath = function(route,title,data,handle){
    if(typeof route === 'string'){
      window.history.pushState(data, title, route);
    }
    var ar = getNewReqRes(location.pathname);
    GLOBAL_METHODS.hideAllChildren(document.getElementById(MAIN_CONT_ID));
    ar[1].element.style.display = 'block';
    if(handle !== false) {
      (typeof handle === 'function' ? handle : mainHandler)(ar[0],ar[1]);
    }
    return false;
  };

  window.r2 = window.topath;
  GLOBAL_METHODS.topath = window.topath;

  var eventer = GLOBAL_METHODS.eventer();

  var evon = eventer.on.bind(eventer),
    evonce = eventer.once.bind(eventer),
    evemit = eventer.emit.bind(eventer),
    evremoveListener = eventer.removeListener.bind(eventer);

  function Request(){
    this.on = evon;
    this.once = evonce;
    this.emit = evemit;
    this.removeListener = evremoveListener;
    this.method = 'GET';
    this.parsedUrl = GLOBAL_METHODS.getParsedURL();
  }

  function createOrGetDiv(idm){
    var curEl = document.getElementById(idm);
    var mainBlock = document.getElementById(MAIN_CONT_ID);
    if(!mainBlock) return alert('System not ready. Please refresh the page.');
    if(!curEl){
      curEl = GLOBAL_METHODS.appendHtml(mainBlock,'<div id="'+idm+'"></div>');
    }
    return curEl;
  }

  function Response(opts){
    this.divId = location.pathname.split('/').join('-')
    this.element = createOrGetDiv(this.divId);
  }

  Response.prototype.end = function(str){
    if(!str) return;
    if(typeof str !== 'string'){
      str = str[GLOBAL_VARS.defKey];
    }
    if(typeof str !== 'string'){
      return;
    }
    switch(this.statusCode){
      case 201 :
        GLOBAL_METHODS.appendHtml(this.element, str);
        break;
      default :
        this.element.innerHTML = str;
    }
  };

  function server(handler,config,GLOBAL_API){
    if(!mainHandler) mainHandler = handler;
    var onReady = GLOBAL_METHODS.lastValue(GLOBAL_API, 'root', '_methods', 'onReady');
    if(typeof onReady === 'function'){ onReady(); }
    window.topath();
  };

  return server;
};
