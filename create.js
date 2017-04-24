#! /usr/bin/env node

require('fs').writeFileSync(require('path').join(process.cwd(), 'server.js'),
"var j2s = require('json2server')(); j2s.start();");
