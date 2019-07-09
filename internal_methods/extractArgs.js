var pathmod = require('path');
var join = pathmod.join, isAbsolute = pathmod.isAbsolute;
var methods = require('../index').methods;
var EventEmitter = require('events');
var request = methods.request;
var cwd = process.cwd();
var os = require('os');
var readdirSync = require('fs').readdirSync;

var opts = process.argv.slice(2);
var parsingDone = false;

function getObjectFromFileOrArgument (inp) {
  if (typeof inp === 'string') {
    if (inp.endsWith('.json') || inp.endsWith('.js')) {
      try {
        return require(getStringValue(inp, true));
      } catch (er) {
      }
    }
    try {
      return require(getStringValue(inp, true)+ '.json');
    } catch (er) {
    }
    try {
      return require(getStringValue(inp, true)+ '.js');
    } catch (er) {
    }
    try {
      return JSON.parse(inp);
    } catch (er) {
      if (inp.indexOf(':') !== -1) {
        return Object.assign(...inp.split(',').map(st => { var sp=st.split(':'); return { [sp[0]]:sp[1] }}))
      }
    }
  }
  return inp;
};

var getStringValue = function(inp, isPath){
  try {
    inp = JSON.parse(inp);
  } catch (er) {
    if (isPath) {
      if (isAbsolute(inp)) {
        return inp;
      } else if (inp.indexOf('http') === 0) {
        return new Promise((res, rej) => {
          request(inp, (er, resp) => {
            if (er) rej(er);
            else res(resp && resp.parsed);
          });
        });
      } else {
        inp = join(cwd, inp);
      }
    }
  }
  return inp;
};

function parseArguments(options) {
  var showHelp, ol = opts.length;
  for (var k = 0; k < ol; k++) {
    arg = opts[k];
    if (parsingDone) break;
    if (showHelp === undefined) {
      showHelp = false;
    }
    var ind = arg.indexOf('=');
    var larg = arg.toLowerCase();
    var value = getStringValue(arg.substr(ind+1));
    var key = larg.substr(0, ind) || larg;

    if (ind === -1) {
      if (k+1 === ol && !options.file && !options.jsondir) {
        if (arg.endsWith('.yml')) {
          key = '-f';
        } else if (!(arg.startsWith('-'))) {
          key = '-r';
        }
      } else {
        if (['-es','-se'].indexOf(arg) !== -1) {
          opts.splice(k+1, 0, '-e');
          arg = key = opts[k] = '-s';
          ol++;
        }
        if (['-e','-s', '--evalenabled', '--start'].indexOf(arg) === -1) {
          k++;
          value = opts[k];
        } else {
          if (opts[k+1] === '1') k++;
          value = 1
        }
      }
    }
    switch(key){
      case '-f':
      case '--file':
        if (value) {
          options.file = getStringValue(value, true);
        }
        break;
      case '-r':
      case '--rootdir':
        if(value){ options.rootdir = getStringValue(value, true); }
        break;
      case '-j':
      case '--jsonpath':
        if(value){ options.jsonpath = getStringValue(value, true); }
        break;
      case '-c':
      case '--configpath':
        if(typeof value === 'string'){ getStringValue(value, true); }
        break;
      case '-o':
      case '--outfile':
        if(value){ options.outfile = getStringValue(value, true); }
        break;
      case '-v':
      case '--buildvars':
        if(typeof value === 'string'){ options.buildvars = getObjectFromFileOrArgument(value); }
        break;
      case '-b':
      case '--browser':
        if(value){ options.browser = getStringValue(value, true); }
        break;
      case '-t':
      case '--struct':
        if(value){ options.struct = getStringValue(value, true); }
        break;
      case '-s':
      case '--start':
        if(value){ options.start = true; }
      case '-e':
      case '--evalenabled':
        if(value){ options.evalenabled = true; }
      case '-y':
      case '--autoparse':
        if(value === 'false' || value === '0'){ options.autoparse = false; }
      case '-d':
      case '--staticdir':
        if(value){ options.staticdir = getStringValue(value, true); }
        break;
      case '-p':
      case '--port':
        if(value){ value = parseInt(value,10); if(value) { options.port = value; } }
        break;
      case '-u':
      case '--url':
        if(typeof value === 'string'){ getStringValue(value, true); }
        break;
      case '-m':
      case '--mountpath':
        if(typeof value === 'string' && value.charAt(0) === '/') {
          options.mountpath = getStringValue(value, true);
        }
        break;
      case '-h':
      case '--help':
      case '-v':
      case '--version':
        parsingDone = true;
        showHelp = true;
        break;
      default :
        console.log('    --> INVALID ARGUMENT `'+key+'` PROVIDED ...! Try again with valid arguments.');
        showHelp = true;
    }
  }
  if (showHelp) {
    var optsString = opts.join('');
    if (['-v', '-V', '--version'].indexOf(optsString) !== -1) {
      return 2
    }
  }
  return showHelp;
}

module.exports = function(what,desc,helpar){
  var options = { };
  var showHelp = parseArguments(options)
  var version = require('../package.json').version;
  if (showHelp === undefined || showHelp) {
    if (showHelp === 2) {
      console.log(version);
      process.exit(0);
    }
    console.log('\n    '+what+' - '+desc+' .\n');
    console.log('    version - '+version+'\n');
    console.log(helpar.join('\n'));
    process.exit(2);
  } else {
    if (!options.configpath){
      options.configpath = join(cwd,options.browser?'j2c.json':'j2s.json');
    }
    var read = {};
    try {
      read = require(options.configpath);
    } catch(er){
      delete options.configpath;
      return options;
    }
    for(var ky in read){
      var _ky = ky.toLowerCase();
      if(!(options.hasOwnProperty(_ky))){
        options[_ky] = read[ky];
      }
    }
    return options;
  }
}
