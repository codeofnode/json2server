# Documentation

## Directory structure
> Some rules to identify if its a path module or a just a utility. Consider the root directory is the root module of the directory structure.

* A directory can be act as module only if it has alphanumeric characters in its name.
* A directory can have utilities, if it has alphanumeric characters in its name and is a sub-director of directory named as `_methods`. For example
* Similarily `modA` can also have other sub modules as `subModOfModA` and `subModOfModA` can further have an utility directory `_methods` and also c
* A module/subModule represents a route/subRoute in outer world
* If a route path is a variable, then the module directory name should not start with colon `:` however in the `server.json`, it should start with ':'

## `server.json` or `client.json` structure
> About how you can define this file

### Generic structure of `server.json` or `client.json`
> refer defaults.json for an idea and default values
```txt
{
  "vars" : {
    "var1" : "val1",
    "name" : "json2server",
    "version" : "0.0.1",
    "deftimeout" : 5000, //the default timeout in which response if not sent, will be sent and request will be closed
    "defKey" : "message",
    "var2" : "val2",
    "{{val1}}" : "{{val2}}", // will be replaced as `"val1" : "val2"` before server start
    "nestedVar2" : {
      "nestedVar1" : "nestedVal1"
    }
  },
  "root" : { // this is the root module, and following rules also apply to modules or submodules. whenever the route is matched its variables from
    "+" : { // `+` means to add the values to 'vars'
      "varA" : "valA", // this will create another `varA` property in `vars` with value `valA`
      "vrs" : "{{version}}", // this will create another version shortcut `vrs` property in `vars` with value `0.0.1` as per the vars defined abov
      "requestId":{ // this will call the utility `getRequestId` in the current module.. and whatever is return value will be the value of `requestI
        "@" : "getRequestId" // any right hand object having key `@` means to call a utility with some name defined with its value,
        "params" : "some static or dynamic value" // this will be passed as parameter to utility `getRequestId`
      },
    },
    "=" : [ // `=` means the validation of the input parameters. it must be an array
      {  // each of the item should be object having eval or '@' (calling utility) value
        "@" : "aUtilityToValidateQueryParam", // calling a utility that must return true in order to go ahead, otherwise the failed message linked (
        "params": "{{params.query.aQueryParam}}" // pass as argument
        "ifFailed": { // the error response, in case the current validation fails
          "message":"aQueryParam is missing or having invalid value",
          "status":400
        }
      },
      {  // we can also bring simple eval in the validation item, follows
        // eval as its evil sometimes so it is by defaul disabled, to enable either do from j2s.json file or pass argument --evalenable=true
        "eval":"{{params.query.aQueryParam}} !== undefined" // eval of which will validate if aQueryParam is available in query or not. If undefined
        "ifFailed":{
          "message":"aQueryParam is missing",
          "status":400
        }
      },
      { // say some validation depends on some async task.. like reading the body. Means body parameters will only be available after parsing the bo
        "once":"body-recieved", //up event `body-recieved` this vaildation will be done
        "@" : "aUtilityToValidateQueryParam", // calling a utility that must return true in order to go ahead, otherwise the failed message linked (
        "params": [
          "{{params.query.aQueryParam}}" // pass as argument
          "{{params.query.bQueryParam}}", // pass another argument
          "can also be a static value" // pass static argument
        ]
        "ifFailed" : {
          "message":"aQueryParam is missing or having invalid value",
          "status":400
        }
      }
    ],
    "$" : {  // `$` represents the response against GET request
      "name" : "{{name}}", // replaced as `json2server` before server start
      "version" : "{{version}}" // replaced as `0.0.1` before server start
    },
    "route1": { // any methods related to `route1` must be under _methods directory of route1 directory of root(main) directory.
      "+":{
        "add" : "valueToAdd" // upon /route1
      },
      "=":[
        {
          "eval":"{{somevar}} !== 92",
          "ifFailed" : {
            "message":"error responding",
            "status":400
          }
        }
        // other validations
      ],
      "$" : {  // `$` if /route1 will be recieved
        "data" : "value"
      },
      ">" : {  // basically represented as list. `>` if /route1/ will be recieved
        "data" : [
          { "listitem" : 1 },
          { "listitem" : 2 }
        ]
      },
      "$post" : { // represents the response against POST request
        "once" : "body-recieved", // call only after this event is recieved from `req`
        "@" : "evaluateAndSendResponse", // last parameter to this utility is always a callback calling which will respond to client rightaway with
        "params" : [
          "param can also be passed"
        ]
      },
      "$patch" : { // represents the response against PATCH request
      },
      "$post" : { // represents the response against PUT request
      },
      "$delete" : { // represents the response against DELETE request
      },
      "$options" : { // represents the response against OPTIONS request
      },
      ":pathvar":{ // any methods related this must be under / > route1 > pathvar > _methods
      },
      "route2":{ // module directory as  / > route1 > route2
        //to route2 module same as route1
      }
    }
  }
}
```
### Sequence of properties
> checked once a module/route is passed through the request url path
1. "+"
2. "="
3. "{$,$post,$put,$patch,$delete,$options,:pathvar}"
4. "{anyChildRoute}"
```
