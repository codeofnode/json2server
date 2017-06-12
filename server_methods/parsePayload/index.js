module.exports = function( GLOBAL_APP_CONFIG,GLOBAL_METHODS){

const QS = require('querystring');

const PARSE = function(data,hdr) {
  let parser = JSON;
  if(hdr.indexOf('form-urlencoded') !== -1){
    parser = QS;
  }
  try {
    return parser.parse(data)
  } catch(er){
    return data;
  }
};

function func(vars,req){
  const prs = vars.body;
  if(req.uponParse && typeof prs === 'object' && prs !== null && Object.keys(prs).length === 0) {
    let data = '';
    req.on('data', function(chk){ data += chk });
    function onceOver(){
      vars.body = data ? PARSE(data,GLOBAL_METHODS.lastValue(req, 'headers', 'content-type')) : {};
      req.uponParse = false;
      req.emit('body-parsed');
    };
    req.once('end', onceOver);
    req.once('error',onceOver);
  }
}

return func;

}
