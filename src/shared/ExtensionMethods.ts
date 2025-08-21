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
  for (var attribute in object) {
    if (typeof object[attribute] === "object" && object[attribute] != null)
      cloneObj[attribute] = clone(object[attribute]);
    else
      cloneObj[attribute] = object[attribute];
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


(function()
{
/* Useful function */
function dist2D(x1,y1,x2,y2)
{	var dx = x2-x1;
	var dy = y2-y1;
	return Math.sqrt(dx*dx+dy*dy);
};

/* Add new properties on CanvasRenderingContext2D */
(CanvasRenderingContext2D.prototype as any).textOverflow = "";
(CanvasRenderingContext2D.prototype as any).textJustify = false;
(CanvasRenderingContext2D.prototype as any).textStrokeMin = 0;

var state = [];
var save = CanvasRenderingContext2D.prototype.save;
CanvasRenderingContext2D.prototype.save = function()
{	state.push(
		{	textOverflow: this.textOverflow, 
			textJustify: this.textJustify, 
			textStrokeMin: this.textStrokeMin, 
		});
	save.call(this);
};

var restore = CanvasRenderingContext2D.prototype.restore;
CanvasRenderingContext2D.prototype.restore = function()
{	restore.call(this);
	var s = state.pop();
	this.textOverflow = s.textOverflow;
	this.textJustify = s.textJustify;
	this.textStrokeMin = s.textStrokeMin;
};

/* textPath function */

(CanvasRenderingContext2D.prototype as any).textPath = function (text, path)
{	// Helper to get a point on the path, starting at dl 
	// (return x, y and the angle on the path)
	var di, dpos=0;
	var pos=2;
	function pointAt(dl)
	{	if (!di || dpos+di<dl)
		{ for (; pos<path.length; )
			{	di = dist2D(path[pos-2],path[pos-1], path[pos],path[pos+1]);
				if (dpos+di>dl) break;
				pos += 2;
				if (pos>=path.length) break;
				dpos += di;
			}
		}
   
		var x, y, dt = dl-dpos;
		if (pos>=path.length) 
		{	pos = path.length-2;
		}

		if (!dt) 
		{	x = path[pos-2];
			y = path[pos-1];
		}
		else
		{	x = path[pos-2]+ (path[pos]-path[pos-2])*dt/di;
			y = path[pos-1]+ (path[pos+1]-path[pos-1])*dt/di;
		}
		return [x, y, Math.atan2(path[pos+1]-path[pos-1], path[pos]-path[pos-2])];
	}

	var letterPadding = this.measureText(" ").width *0.25;
  
	// Calculate length
	var d = 0;
	for (var i=2; i<path.length; i+=2)
	{	d += dist2D(path[i-2],path[i-1],path[i],path[i+1])
	}
	if (d < this.minWidth) return;
	var nbspace = text.split(" ").length -1;

	// Remove char for overflow
	if (this.textOverflow != "visible")
	{	if (d < this.measureText(text).width + (text.length-1 + nbspace) * letterPadding)
		{	var overflow = (this.textOverflow=="ellipsis") ? '\u2026' : this.textOverflow||"";
			var dt = overflow.length-1;
			do
			{	if (text[text.length-1]===" ") nbspace--;
				text = text.slice(0,-1);
			} while (text && d < this.measureText(text+overflow).width + (text.length + dt + nbspace) * letterPadding)
			text += overflow;
		}
	}

	// Calculate start point
	var start = 0;
	switch (this.textJustify || this.textAlign)
	{	case true: // justify
		case "center":
		case "end":
		case "right":
		{	// Justify
			if (this.textJustify) 
			{	start = 0;
				letterPadding = (d - this.measureText(text).width) / (text.length-1 + nbspace);
			}
			// Text align
			else
			{	start = d - this.measureText(text).width - (text.length + nbspace) * letterPadding;
				if (this.textAlign == "center") start /= 2;
			}
			break;
		}
		// left
		default: break;
	}
  
	// Do rendering
	for (var t=0; t<text.length; t++)
	{	var letter = text[t];
		var wl = this.measureText(letter).width;
    
		var p = pointAt(start+wl/2);

		this.save();
		this.textAlign = "center";
		this.translate(p[0], p[1]);
		this.rotate(p[2]);
		if (this.lineWidth>0.1) this.strokeText(letter,0,0);
		this.fillText(letter,0,0);
		this.restore();
		start += wl+letterPadding*(letter==" "?2:1);
	}
  
};

})();

export function getRateFromOutputRate(outputRate){
	let minRate = 0.75;
	let maxRate = 2.5;
	let maxOutputRate = 10;
	let diff = maxRate - minRate;
	return minRate + (outputRate / maxOutputRate) * diff;
}
export function getRateFromPerformance(performance){
	let minRate = 1.25;
	let maxRate = 3.5;
	let maxPerformance = 10;
	let diff = maxRate - minRate;
	return minRate + (performance / maxPerformance) * diff;
}
