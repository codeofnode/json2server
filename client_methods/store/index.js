
module.exports = function(require, GLOBAL_APP_CONFIG,GLOBAL_METHODS){

  function func(){
    function Store(){
      this.db = {};
    }
    Store.prototype.set = function(name,arr){
      this.db[name] = arr;
    }
    Store.prototype.get = function(name){
      return this.db[name];
    }
    Store.prototype.setOne = function(name,id,data){
    }
    Store.prototype.getOne = function(name,id){
    }
    return new Store();
  }

  return func;
}
