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
$ json2server // run instant server in current directory
$ json2server --outfile=true // to build and generate a server file
$ json2server --browser=true // to build and generate a client file
```

## more options
[See this file](https://github.com/codeofnode/json2server/blob/master/internal_methods/extractArgs.js)

## Documentation

[Documentation about server.json/client and points to keep in mind](https://github.com/codeofnode/json2server/blob/master/DOC.md)

## License

MIT © [Ramesh Kumar](codeofnode-at-the-rate-gmail-dot-com)
