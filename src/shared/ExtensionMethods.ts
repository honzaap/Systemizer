import { HTTPMethod } from "src/models/enums/HTTPMethod";

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

let formattedDbMethod ={
  "Inherit": "Inherit",
  "GET": "SELECT",
  "POST": "INSERT",
  "PUT": "UPDATE",
  "PATCH": "UPDATE",
  "DELETE": "DELETE"
}

export function getFormattedMethod(method: HTTPMethod, isDatabase: boolean){
  return isDatabase ? formattedDbMethod[method.toString()] : method.toString();
}

export function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

export function downloadPng(filename, image) {
  var element = document.createElement('a');
  element.setAttribute('href', image);
  element.setAttribute('download', filename);
  
  element.style.display = 'none';
  document.body.appendChild(element);
  
  element.click();
  
  document.body.removeChild(element);
}

export function downloadSvg(filename, svg) {

  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(svg);
  
  //add name spaces.
  if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  
  //add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  
  //convert svg source to URI data scheme.
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
  
  var element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  
  element.style.display = 'none';
  document.body.appendChild(element);
  
  element.click();
  
  document.body.removeChild(element);
}

export function clone(object: any): any {
  var cloneObj = new (object.constructor as any);
  for (var attribut in object) {
    if (typeof object[attribut] === "object" && object[attribut] != null)
      cloneObj[attribut] = clone(object[attribut]);
    else
      cloneObj[attribut] = object[attribut];
  }
  return cloneObj;
}

export function createRoundedPath(coords, radius, close) {
  let path = ""
  const length = coords.length + (close ? 1 : -1)
  for (let i = 0; i < length; i++) {
    const a = coords[i % coords.length]
    const b = coords[(i + 1) % coords.length]
    const t = Math.min(radius / Math.hypot(b.x - a.x, b.y - a.y), 0.5)

    if (i > 0) path += `Q${a.x},${a.y} ${a.x * (1 - t) + b.x * t},${a.y * (1 - t) + b.y * t}`

    if (!close && i == 0) path += `M${a.x},${a.y}`
    else if (i == 0) path += `M${a.x * (1 - t) + b.x * t},${a.y * (1 - t) + b.y * t}`

    if (!close && i == length - 1) path += `L${b.x},${b.y}`
    else if (i < length - 1) path += `L${a.x * t + b.x * (1 - t)},${a.y * t + b.y * (1 - t)}`
  }
  if (close) path += "Z"
  return path
}

export function createRoundedCanvasPath(ctx: CanvasRenderingContext2D, coords, radius) {
  const length = coords.length -1
  ctx.beginPath();
  for (let i = 0; i < length; i++) {
    const a = coords[i % coords.length]
    const b = coords[(i + 1) % coords.length]
    const t = Math.min(radius / Math.hypot(b.x - a.x, b.y - a.y), 0.5)
    if (i > 0) {
      ctx.quadraticCurveTo(a.x, a.y, a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t);
    }
    if (i == 0) {
      ctx.moveTo(a.x, a.y);
    }
    if (i == length - 1) {
      ctx.lineTo(b.x, b.y);
      ctx.stroke()
    }
  }
  ctx.closePath()
}
