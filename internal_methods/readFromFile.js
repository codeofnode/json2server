
var fs =require('fs'), path = require('path');

function readFromHtml(str,dir,vrt,assign,vars,replace){
  var matches = str.match(/\'\'\;\/\/READ_FROM_FILE\,(\w*)\.(\w*)/gm);
  if(matches){
    matches.forEach(function(m){
      var fl = m.split(',').pop();
      var vrs = assign(undefined,vars);
      assign(vrs,replace(vrt,vars));
      try {
        str = str.replace(m,
          "('"+replace((fs.readFileSync(path.join(dir,fl)).toString()).split('\n'),vrs).join('').replace(/\'/g,"\\'")+"');");
      } catch(lm){
        console.log(lm);
      }
    });
  }
  return str;
}

module.exports = readFromHtml;
