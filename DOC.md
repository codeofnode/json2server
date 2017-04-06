# Documentation

## Directory structure
> Some rules to identify if its a path module or a just a utility. Consider the root directory is the root module of the directory structure.

* A directory can be act as module only if it has alphanumeric characters in its name.
* A directory can have utilities, if it has alphanumeric characters in its name and is a sub-director of directory named as `_methods`. For example say structure is `modA` > `_methods` > `util1` then this means that `util1` is a utility of `modA`
* Similarily `modA` can also have other sub modules as `subModOfModA` and `subModOfModA` can further have an utility directory `_methods` and also can have sub-sub directory `subModOfSubModOfModA`.
* A module/subModule represents a route/subRoute in outer world
* If a route path is a variable, then the module directory name should not start with colon `:` however in the `api.json`, it should start with ':'

## `api.json` structure
> About how you can define your `api.json` file

### Generic structure of `api.json`
> refer defaults.json for an idea and default values
```txt
{
	"_vars" : {
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
  "_root" : { // this is the root module, and following rules also apply to modules or submodules. whenever the route is matched its variables from `_vars` key in json file and utilities from `_methods` directory in specific module directory are merged and made available to rest of the execution until response is sent to client.
    "+" : { // `+` means to add the values to '_vars'
      "varA" : "valA", // this will create another `varA` property in `vars` with value `valA`
      "vrs" : "{{version}}", // this will create another version shortcut `vrs` property in `_vars` with value `0.0.1` as per the _vars defined above.
      "requestId":{ // this will call the utility `getRequestId` in the current module.. and whatever is return value will be the value of `requestId` key in the `_vars`
        "@" : "getRequestId" // any right hand object having key `@` means to call a utility with some name defined with its value,
        "params" : "some static or dynamic value" // this will be passed as parameter to utility `getRequestId`
      },
    },
    "=" : [ // `=` means the validation of the input parameters. it must be an array
      {  // each of the item should be object having eval or '@' (calling utility) value
        "@" : "aUtilityToValidateQueryParam", // calling a utility that must return true in order to go ahead, otherwise the failed message linked (as last item of this validation array) will be sent immediated and request will be terminated
        "params": "{{params.query.aQueryParam}}" // pass as argument
        "ifFailed": { // the error response, in case the current validation fails
          "message":"aQueryParam is missing or having invalid value",
          "status":400
        }
      },
      {  // we can also bring simple eval in the validation item, follows
        "eval":"{{params.query.aQueryParam}} !== undefined" // eval of which will validate if aQueryParam is available in query or not. If undefined the `ifFailed` will be sent to client as response
        "ifFailed":{
          "message":"aQueryParam is missing",
          "status":400
        }
      },
      { // say some validation depends on some async task.. like reading the body. Means body parameters will only be available after parsing the body etc. say at point request emit an event say `body-recieved` then we need to check for the validations. in this case the first parameter must be a string with the event name.
        "uponEvent":"body-recieved", //up event `body-recieved` this vaildation will be done
        "@" : "aUtilityToValidateQueryParam", // calling a utility that must return true in order to go ahead, otherwise the failed message linked (as last item of this validation array) will be sent immediated and request will be terminated
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
        "uponEvent" : "body-recieved", // call only after this event is recieved from `req`
        "@" : "evaluateAndSendResponse", // last parameter to this utility is always a callback calling which will respond to client rightaway with first argument as the response object and second argument as the statusCode
        "params" : [
          "param also be passed"
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
3. "{$,c$,u$,p$,d$,o$}"
```
