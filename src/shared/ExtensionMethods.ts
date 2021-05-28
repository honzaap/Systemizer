import { EndpointActionHTTPMethod, HTTPMethod } from "src/models/enums/HTTPMethod";

export function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

export function arrayEquals(a1,a2){
  for(let a of a1){
    if(a2.indexOf(a) == -1)return false;
  }
  for(let a of a2){
    if(a1.indexOf(a) == -1)return false;
  }
  return true;
}

export function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function getFormattedMethod(method: HTTPMethod, isDatabase: boolean){
  if(isDatabase){
    switch(method.toString()){
      case "Inherit":
        return "Inherit";
      case "GET":
        return "SELECT";
      case "POST":
        return "INSERT";
      case "PUT":
        return "UPDATE";
      case "PATCH":
        return "UPDATE";
      case "DELETE":
        return "DELETE";
      default: 
        return "INSERT"
    }
  }
  else{
    switch(method.toString()){
      case "Inherit":
        return "Inherit";
      case "GET":
        return "GET";
      case "POST":
        return "POST";
      case "PUT":
        return "PUT";
      case "PATCH":
        return "PATCH";
      case "DELETE":
        return "DELETE";
      default: 
        return "GET"
    }
  }
}