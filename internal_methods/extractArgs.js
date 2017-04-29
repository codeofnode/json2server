
var path = require('path'), cwd = process.cwd();

module.exports = function(what,desc,helpar){
  var options = { };
  var opts = process.argv.slice(2), showHelp = false;
  var version = require('../package.json').version;

  var getStringValue = function(inp){
    if(inp === '1' || inp === 'true') return true;
    else if(inp) return inp;
    else return undefined;
  };

  opts.forEach(function(arg){
    var ind = arg.indexOf('=');
    if(ind === -1) return showHelp = true;
    else var key = arg.substr(0,ind), value = getStringValue(arg.substr(ind+1));
    switch(key.toLowerCase()){
      case '-r':
      case '--rootdir':
        if(value){ options.rootdir = value === true ? value : path.join(cwd,value); }
        break;
      case '-j':
      case '--jsonpath':
        if(value){ options.jsonpath = value === true ? value : path.join(cwd,value); }
        break;
      case '-c':
      case '--configpath':
        if(value){ options.configpath = value === true ? value : path.join(cwd,value); }
        break;
      case '-o':
      case '--outfile':
        if(value){ options.outfile = value === true ? value : path.join(cwd,value); }
        break;
      case '-b':
      case '--browser':
        if(value){ options.browser = value === true ? value : path.join(cwd,value); }
        break;
      case '-t':
      case '--struct':
        if(value){ options.struct = value === true ? value : path.join(cwd,value); }
        break;
      case '-s':
      case '--start':
        if(value === true){ options.start = true; }
      case '-d':
      case '--staticdir':
        if(value){ options.staticdir = value === true ? value : path.join(cwd,value); }
        break;
      case '-p':
      case '--port':
        if(value){ options.port = parseInt(value,10); }
        break;
      case '-m':
      case '--mountpath':
        if(value){ options.mountpath = value === true ? value : path.join(cwd,value); }
        break;
      case '-h':
      case '--help':
      default :
        console.log('    --> INVALID ARGUMENT `'+key+'` PROVIDED ...! Try again with valid arguments.');
        showHelp = true;
    }
  });

  if(showHelp){
    console.log('\n    '+what+' - '+desc+' .\n');
    console.log('    version - '+version+'\n');
    console.log(helpar.join('\n'));
    process.exit(2);
  } else {
    if(!options.configpath){
      options.configpath = path.join(process.cwd(),options.browser?'j2c.json':'j2s.json');
    }
    var read = {};
    try {
      read = require(options.configpath);
    } catch(er){
      return options;
    }
    for(var ky in read){
      ky = ky.toLowerCase();
      if(!(options.hasOwnProperty(ky))){
        options[ky] = read[ky];
      }
    }
    return options;
  }
}