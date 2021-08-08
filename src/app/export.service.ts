import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { APIGateway } from 'src/models/APIGateway';
import { ClientCluster } from 'src/models/ClientCluster';
import { Technology } from 'src/models/enums/Technology';
import { MessageQueue } from 'src/models/MessageQueue';
import { Port } from 'src/models/Port';
import { TextField } from 'src/models/TextField';
import { createRoundedCanvasPath, createRoundedPath, UUID } from 'src/shared/ExtensionMethods';
import { PlacingService } from './placing.service';
import { SavingService } from './saving.service';

@Injectable({
  	providedIn: 'root'
})
export class ExportService {

	private svgns = "http://www.w3.org/2000/svg";

  	constructor(private placingService: PlacingService, private savingService: SavingService) { }

	public getComponentSize(component: IDataOperator){
		if(component instanceof TextField)
			return {width: component.options.width, height: component.options.height};
		return {width: component instanceof MessageQueue ? 80 : 40, height: component instanceof APIGateway || component instanceof ClientCluster ? 80 : 40}
	}

	convertTechnology(tech: Technology){
		return Technology[tech].toLowerCase().replace(/ /g,'').replace(/#/g, 'sharp');
	}

  	async getCanvas(components: IDataOperator[], options: ExportPngOptions){
		let canvas = document.createElement("canvas");
		canvas.width = this.placingService.boardWidth;
		canvas.height = this.placingService.boardHeight;
		let offsetX = 0;
		let offsetY = 0;
		if(options.captureUsed){ // Crop the board
			let {minX, minY, maxX, maxY} = this.captureUsedArea(components);
			offsetX = Math.max(0, minX - 40);
			offsetY = Math.max(0, minY - 40);
			canvas.width = Math.min(this.placingService.boardWidth, maxX + 40 - offsetX);
			canvas.height = Math.min(this.placingService.boardHeight, maxY + 40 - offsetY);
		}
		let ctx = canvas.getContext("2d");
		if(!options.transparentBackground){
			ctx.fillStyle = options.lightMode ? "#fff" : "#282A37";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		for(let component of components){
			// Render component
			ctx.beginPath()
			ctx.fillStyle = component.color;
			let {width, height} = this.getComponentSize(component);
	
			// Render image
			if(component instanceof TextField){
				ctx.fillStyle = component.options.backgroundColor;
				ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
				ctx.lineWidth = 2;
				ctx.rect(component.options.X - offsetX, component.options.Y - offsetY, component.options.width, component.options.height);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = component.options.color;
				ctx.font = `${component.options.isBold ? "bold" : ""}  ${component.options.isItalic ? "italic" : ""} ${component.options.fontSize}px Arial`;
				ctx.textAlign = 'left'
				ctx.textBaseline = 'alphabetic'
				this.wrapCanvasText(ctx, component.options.title, component.options.X - offsetX + 3, component.options.Y - offsetY + component.options.fontSize + 3,  component.options.width - 6, component.options.height - 6, component.options.fontSize+3)
			}
			else{
				ctx.fillRect(component.options.X - offsetX, component.options.Y - offsetY, width, height);
				let img = new Image();
				await new Promise(r => {img.onload=r ; img.src=`./assets/${this.savingService.getComponentType(component).toLowerCase()}.svg`});
				ctx.drawImage(img, component.options.X - offsetX + width/2 - 20 + 7, component.options.Y - offsetY + height/2 - 20 + 7, 26, 26);
				if(options.showTitles)
					this.renderComponentTitleToCanvas(ctx, component, options.transparentBackground ? options.lightTitles : !options.lightMode, offsetX, offsetY);
			}
			ctx.fillStyle = options.lightMode ? "#fff" : "#282A37"
			ctx.lineWidth = 2;
			if(component["inputPort"]){ 
				// Render connections
				this.renderConnectionsToCanvas(ctx, options.transparentBackground ? options.lightTitles : !options.lightMode, component, offsetX, offsetY);
			}
		}
		for(let component of components){
			let {width, height} = this.getComponentSize(component);
			if(component.options.technology != null && component.options.technology != 0 && options.showTechnologies){
				let img = new Image();
				await new Promise(r => {img.onload=r ; img.src=`./assets/technologies/${this.convertTechnology(component.options.technology)}.svg`});
				ctx.drawImage(img, component.options.X - offsetX + width - 10, component.options.Y - offsetY - 10, 20, 20);
			}
		}
		ctx.fillStyle = "#282A37";
		this.renderPortsToCanvas(ctx, components, offsetX, offsetY);
		return canvas;
	}

	private wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, maxHeight: number, lineHeight: number) {
        let line = '';
		let height = lineHeight;
		for(let letter of text){
			var newLine = line + letter;
			var metrics = context.measureText(newLine);
			var newWidth = metrics.width;
			if(newWidth > maxWidth){
				context.fillText(line, x, y);
				line = letter;
				y += lineHeight;
				height += lineHeight;
				if(height >= maxHeight){
					return;
				}
			}
			else {
				line = newLine;
			}
		}
        context.fillText(line, x, y);
	}

	private renderPortsToCanvas(ctx: CanvasRenderingContext2D, components: IDataOperator[], offsetX: number, offsetY: number){
		for(let component of components){ // Render ports (render them over connections)
			ctx.strokeStyle = component.color;
			ctx.lineWidth = 2;
			let {width, height} = this.getComponentSize(component);
			if(component["inputPort"] && component["inputPort"].connections.length > 0){ // Render input port
				ctx.beginPath()
				ctx.arc(component.options.X - offsetX - 12, component.options.Y - offsetY + height/2, 7.5, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();
			}
			if(component["outputPort"] && component["outputPort"].connections.length > 0){ // Render output port
				ctx.beginPath()
				ctx.arc(component.options.X - offsetX + width + 12, component.options.Y - offsetY + height/2, 7.5, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();
			}
		}
	}

	private renderConnectionsToCanvas(ctx: CanvasRenderingContext2D, lightMode: boolean, component: IDataOperator, offsetX: number, offsetY: number){
		for(let connection of (component["inputPort"] as Port).connections){
			let {width, height} = this.getComponentSize(component);
			let component2 = connection.getOtherPort(component["inputPort"]).parent;
			let size2 = this.getComponentSize(component2);
			var grad= ctx.createLinearGradient(component.options.X - offsetX, component.options.Y - offsetY,
				 component2.options.X - offsetX + size2.width, component2.options.Y - offsetY + size2.height);
			grad.addColorStop(0, component.color);
			grad.addColorStop(1, component2.color);
			ctx.strokeStyle = grad;
			let comp2 = connection.getOtherPort(component["inputPort"]).parent;
			let comp2Size = this.getComponentSize(comp2);
			let comp2Width = comp2Size.width;
			let comp2Height = comp2Size.height;
			if(connection.lineBreaks == null || connection.lineBreaks.length == 0){
				ctx.beginPath();
				ctx.moveTo(component.options.X - offsetX - 12, component.options.Y - offsetY + height/2);
				ctx.lineTo(comp2.options.X - offsetX + comp2Width + 12, comp2.options.Y - offsetY + comp2Height/2);
				ctx.stroke()
				ctx.closePath() 
			}
			else{
				ctx.beginPath();
				ctx.moveTo(connection.lineBreaks[0].x - offsetX, connection.lineBreaks[0].y - offsetY);
				ctx.closePath() 
				for(let lineBreak of connection.lineBreaks){
					ctx.lineTo(lineBreak.x - offsetX, lineBreak.y - offsetY);
					ctx.stroke()
				}
			}
		
			if(connection.lineBreaks && connection.title){
				// Draw text along the path
				ctx.font="12px Arial";
				ctx.textBaseline = "bottom";
				ctx.strokeStyle = "transparent";
				ctx.fillStyle = lightMode ? "#dadada" : "#454545";
				let lineBreaks = [];
				connection.lineBreaks.forEach(br => {lineBreaks.push(...[br.x - offsetX, br.y - offsetY]);});
				(ctx as any).textPath(connection.title || "", lineBreaks);
			}
		}
	}

	private renderComponentTitleToCanvas(ctx: CanvasRenderingContext2D, component: IDataOperator, lightMode: boolean, offsetX: number, offsetY: number){
		let {width, height} = this.getComponentSize(component);
		ctx.fillStyle = lightMode ? "#c9c9c9" : "#454545";
		ctx.setLineDash([0]);
		ctx.font = 'normal 12px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'alphabetic'
		ctx.fillText(component.options.title, component.options.X - offsetX+width/2, component.options.Y - offsetY - 10)
	
	}

	private wrapSvgText(svg: SVGElement, text: string, color: string, x: number, y: number, maxWidth: number, maxHeight: number, lineHeight: number, fontSize: number, isBold = false, isItalic = false) {
        let line = '';
		let height = lineHeight;

		for(let letter of text){
			var newLine = line + letter;
			let newSvgLine = this.createSvgText(newLine, color, x, y, fontSize, isBold, isItalic);
			svg.appendChild(newSvgLine);
			let newWidth = newSvgLine.getComputedTextLength()
			svg.removeChild(newSvgLine);
			if(newWidth > maxWidth){
				let newText = this.createSvgText(line, color, x, y, fontSize, isBold, isItalic);
				svg.appendChild(newText);
				line = letter;
				y += lineHeight;
				height += lineHeight;
				if(height >= maxHeight){
					return;
				}
			}
			else {
				line = newLine;
			}
		}
		let newText = this.createSvgText(line, color, x, y, fontSize, isBold, isItalic);
		svg.appendChild(newText);
	}

	private createSvgText(text, color: string, x, y, fontSize, isBold = false, isItalic = false){
		let textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
		textSvg.setAttributeNS(null,"x",(x).toString());     
		textSvg.setAttributeNS(null,"y",(y).toString()); 
		textSvg.setAttributeNS(null,"font-size",`${fontSize}px`);
		textSvg.setAttributeNS(null,"font-family",'Arial');
		textSvg.setAttributeNS(null,"font-weight",`${isBold ? "bold" : "normal"}`);
		textSvg.setAttributeNS(null,"font-style",`${isItalic ? "italic" : "normal"}`);
		textSvg.setAttributeNS(null,"fill", color);
		textSvg.textContent = text;
		return textSvg;
	}

	/**
	 * Returns minimal and maximal x and y coordinates of the given components
	 */
	private captureUsedArea(components: IDataOperator[]){
		let minX = Number.MAX_VALUE;
		let minY = Number.MAX_VALUE;
		let maxX = 0;
		let maxY = 0;
		for(let component of components){
			let width: number;
			let height: number;
			if(component instanceof TextField){
				width = component.options.width;
				height = component.options.height;					
			}
			else{
				let sizes = this.getComponentSize(component);
				width = sizes.width;
				height = sizes.height;
			}

			let outputPort = component["outputPort"]
			if(outputPort){
				let connections = outputPort.connections;
				connections.forEach(connection => {
					connection.lineBreaks.forEach(lineBreak => {
						minX = Math.min(minX, lineBreak.x);
						minY = Math.min(minY, lineBreak.y);
						maxX = Math.max(maxX, lineBreak.x);
						maxY = Math.max(maxY, lineBreak.y);
					})
				})
			}

			minX = Math.min(minX, component.options.X);
			minY = Math.min(minY, component.options.Y);
			maxX = Math.max(maxX, component.options.X + width);
			maxY = Math.max(maxY, component.options.Y + height);
		}
		return {minX, minY, maxX, maxY};
	}

	async getSvg(components: IDataOperator[], options: ExportSvgOptions){
		if(components.length == 0)
			return null;
		let svg = document.createElementNS(this.svgns, "svg") as SVGElement;
		document.getElementsByTagName("body")[0].appendChild(svg);
		let offsetX = 0;
		let offsetY = 0;
		// Crop the board
		let {minX, minY, maxX, maxY} = this.captureUsedArea(components);
		offsetX = Math.max(0, minX - 40);
		offsetY = Math.max(0, minY - 40);
		svg.setAttribute("width", `${Math.min(this.placingService.boardWidth, maxX + 40 - offsetX)}`);
		svg.setAttribute("height", `${Math.min(this.placingService.boardHeight, maxY + 40 - offsetY)}`);
		for(let component of components){
			let {width, height} = this.getComponentSize(component);
	
			// Render image
			if(component instanceof TextField){
				let rect = document.createElementNS(this.svgns, 'rect');
				rect.setAttributeNS(null, 'x', (component.options.X - offsetX).toString());
				rect.setAttributeNS(null, 'y', (component.options.Y - offsetY).toString());
				rect.setAttributeNS(null, 'width', component.options.width.toString());
				rect.setAttributeNS(null, 'height', component.options.height.toString());
				rect.setAttributeNS(null, 'fill', component.options.backgroundColor);
				rect.setAttributeNS(null, 'stroke-width', '2');
				rect.setAttributeNS(null, 'stroke', "rgba(0, 0, 0, 0.1)");
				svg.appendChild(rect);
				this.wrapSvgText(svg, component.options.title, component.options.color, component.options.X - offsetX + 3, component.options.Y - offsetY + component.options.fontSize + 3, component.options.width - 6, component.options.height - 6, component.options.fontSize, component.options.fontSize, component.options.isBold, component.options.isItalic);
			}
			else{
				let rect = document.createElementNS(this.svgns, 'rect');
				rect.setAttributeNS(null, 'x', (component.options.X - offsetX).toString());
				rect.setAttributeNS(null, 'y', (component.options.Y - offsetY).toString());
				rect.setAttributeNS(null, 'rx', "3");
				rect.setAttributeNS(null, 'ry', "3");
				rect.setAttributeNS(null, 'width', width.toString());
				rect.setAttributeNS(null, 'height', height.toString());
				rect.setAttributeNS(null, 'fill',  component.color);
				svg.appendChild(rect);
				let img = document.createElementNS(this.svgns,'image') as SVGImageElement;
				img.setAttributeNS(null,'height','26');
				img.setAttributeNS(null,'width','26');
				img.setAttributeNS('http://www.w3.org/1999/xlink','href', `https://honzaap.github.io/Systemizer/assets/${this.savingService.getComponentType(component).toLowerCase()}.svg`);
				img.setAttributeNS(null,'x', (component.options.X - offsetX + width/2 - 20 + 7).toString());
				img.setAttributeNS(null,'y', (component.options.Y - offsetY + height/2 - 20 + 7).toString());
				img.setAttributeNS(null, 'visibility', 'visible');
				
				svg.appendChild(img);
				if(options.showTitles)
					this.renderComponentTitleToSvg(svg, component, options.lightTitles, offsetX, offsetY);
			}

			if(component["inputPort"]){ 
				this.renderConnectionsToSvg(svg, component, options.lightTitles, offsetX, offsetY);
			}
		}
		for(let component of components){
			let {width, height} = this.getComponentSize(component);
			if(component.options.technology != null && component.options.technology != 0 && options.showTechnologies){
				let img = document.createElementNS(this.svgns,'image') as SVGImageElement;
				img.setAttributeNS(null,'height','20');
				img.setAttributeNS(null,'width','20');
				img.setAttributeNS('http://www.w3.org/1999/xlink','href', `https://honzaap.github.io/Systemizer/assets/technologies/${this.convertTechnology(component.options.technology)}.svg`);
				img.setAttributeNS(null,'x', (component.options.X - offsetX + width -10).toString());
				img.setAttributeNS(null,'y', (component.options.Y - offsetY - 10).toString());
				img.setAttributeNS(null, 'visibility', 'visible');
				
				svg.appendChild(img);
			}
		}
		this.renderPortsToSvg(svg, components, options.lightTitles, offsetX, offsetY);
		return svg;
	}

	private renderPortsToSvg(svg: SVGElement, components: IDataOperator[], lightMode: boolean, offsetX: number, offsetY: number){
		for(let component of components){ // Render ports (render then over connections)
			let {width, height} = this.getComponentSize(component);
			if(component["inputPort"] && component["inputPort"].connections.length > 0){ // Render input port
				let port = document.createElementNS(this.svgns,"circle");
				port.setAttribute("cx", (component.options.X - offsetX - 12).toString());
				port.setAttribute("cy", (component.options.Y - offsetY + height/2).toString());
				port.setAttribute("r", "7.5");
				port.setAttribute("fill", lightMode ? "#fff" : "#282A37");
				port.setAttribute("stroke", component.color);
				port.setAttribute("stroke-width", "2");
				svg.appendChild(port);
			}
			if(component["outputPort"] && component["outputPort"].connections.length > 0){ // Render output port
				let port = document.createElementNS(this.svgns,"circle");
				port.setAttribute("cx", (component.options.X - offsetX + width + 12).toString());
				port.setAttribute("cy", (component.options.Y - offsetY + height/2).toString());
				port.setAttribute("r", "7.5");
				port.setAttribute("fill", lightMode ? "#fff" : "#282A37");
				port.setAttribute("stroke", component.color);
				port.setAttribute("stroke-width", "2");
				svg.appendChild(port);
			}
		}
	}

	private renderConnectionsToSvg(svg: SVGElement, component: IDataOperator, lightMode: boolean, offsetX: number, offsetY: number){
		// Render connections
		for(let connection of (component["inputPort"] as Port).connections){
			var newLine = document.createElementNS(this.svgns,'path');
			let grad = document.createElementNS(this.svgns, "linearGradient");
			let stop1 = document.createElementNS(this.svgns, "stop");
			let stop2 = document.createElementNS(this.svgns, "stop");
			let id = UUID().slice(0, 6);
			grad.id = id;
			newLine.id = `con-${id}`;
			grad.setAttribute("x1", "0");
			grad.setAttribute("y1", "0");
			grad.setAttribute("x2", "100%");
			grad.setAttribute("y2", "0");
			stop1.setAttribute("offset", "0%");
			stop2.setAttribute("offset", "100%");
			stop1.setAttribute("stop-color", connection.getOtherPort(component["inputPort"]).parent.color);
			stop2.setAttribute("stop-color", component.color);
			let line = createRoundedPath(connection.lineBreaks.map(br => {return {x: br.x - offsetX, y: br.y - offsetY}}), 10, false);
			newLine.setAttribute("d", line);
			newLine.setAttribute("stroke", `url(#${id})`);
			newLine.setAttribute("fill", "transparent");
			newLine.setAttribute("stroke-width", "2");
			grad.appendChild(stop1);
			grad.appendChild(stop2);
			svg.appendChild(grad);
			svg.appendChild(newLine);

			if(connection.lineBreaks && connection.title){
				let text = document.createElementNS(this.svgns, "text");
				let textPath = document.createElementNS(this.svgns, "textPath");
				text.setAttribute("text-anchor", "middle");
				text.setAttribute("fill", lightMode ? "#dadada" : "454545");
				text.setAttribute("font-size", "12px");
				text.setAttribute("font-family", "Arial");
				textPath.setAttribute("startOffset", "50%");
				textPath.setAttribute("href", `#con-${id}`);
				textPath.setAttribute("dominant-baseline", "text-after-edge");
				textPath.textContent = connection.title;
				text.appendChild(textPath);
				svg.appendChild(text);
			}
		}
	}

	private renderComponentTitleToSvg(svg: SVGElement, component: IDataOperator, lightMode: boolean, offsetX: number, offsetY: number){
		let {width, height} = this.getComponentSize(component);
		let newText = this.createSvgText(component.options.title, lightMode ? "#fff" : "#000", component.options.X - offsetX+width/2, component.options.Y - offsetY - 10, 12);
		newText.setAttributeNS(null,"text-anchor",'middle');
		newText.setAttributeNS(null,"fill", lightMode ? "#c9c9c9" : "#454545");
		svg.appendChild(newText);
	}
}

export class ExportPngOptions{
	/**
	 * Capture only used part of board instead of the whole board
	 */
	captureUsed: boolean = false;
	transparentBackground: boolean = false;
	showTitles: boolean = true;
	showTechnologies: boolean = true;
	lightTitles: boolean = true;
	lightMode: boolean = false;
}

export class ExportSvgOptions{
	showTitles: boolean = true;
	showTechnologies: boolean = true;
	lightTitles: boolean = true;
}

export class EmbedIFrameOptions{
	showTitles: boolean = true;
	darkMode: boolean = false;
}