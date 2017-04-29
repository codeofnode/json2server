# json2server

> Provide a json to ready a server. It has routes, validations and more.

## Why

- Make code structure simple and highly modular
- Anyone can read and understand the flow control of server at high level.
- High level configurations and yet fully customizable
- Variable replacement at init and also at runtime
- Routes setup within json

## Install

```
$ npm install [-g] json2server
```

## Usage

### As global module

```
$ npm install -g json2server
$ cd /directory/where/api_dot_json/exists
$ json2server // for single combined file, useful for prod
$ KEEP_STRUCTURE=true json2server //  leaving directory structure as it, useful for dev
$ node index.js
```
### As local module

```
$ cd /directory/where/api_dot_json/exists
$ npm install json2server
$ node node_modules/json2server/create
$ node server.js
```

## Documentation

[Documentation about server.json and points to keep in mind](https://github.com/codeofnode/json2server/blob/master/DOC.md)

## License

MIT © [Ramesh Kumar](codeofnode-at-the-rate-gmail-dot-com)
