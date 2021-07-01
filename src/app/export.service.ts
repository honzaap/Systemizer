import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { APIGateway } from 'src/models/APIGateway';
import { MessageQueue } from 'src/models/MessageQueue';
import { Port } from 'src/models/Port';
import { TextField } from 'src/models/TextField';
import { PlacingService } from './placing.service';
import { SavingService } from './saving.service';

@Injectable({
  	providedIn: 'root'
})
export class ExportService {

	private svgns = "http://www.w3.org/2000/svg";

  	constructor(private placingService: PlacingService, private savingService: SavingService) { }

	private getComponentSize(component: IDataOperator){
		return {width: component instanceof MessageQueue ? 80 : 40, height: component instanceof APIGateway ? 80 : 40}
	}

  	async getCanvas(components: IDataOperator[], options: ExportPngOptions){
		if(components.length == 0)
			return null;
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
			ctx.fillStyle = "#141625";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		for(let component of components){
			// Render component
			ctx.beginPath()
			ctx.fillStyle = "#080a1a";
			let {width, height} = this.getComponentSize(component);
	
			// Render image
			if(component instanceof TextField){
				ctx.fillStyle = "#222947";
				ctx.strokeStyle = "#101732";
				ctx.lineWidth = 2;
				ctx.setLineDash([0]);
				ctx.rect(component.options.X - offsetX, component.options.Y - offsetY, component.options.width, component.options.height);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "#fff";
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
			}

			// Render title
			if(options.showTitles && !(component instanceof TextField)){
				this.renderComponentTitleToCanvas(ctx, component, offsetX, offsetY);
			}

			ctx.fillStyle = '#080a1a'
			ctx.strokeStyle = "#df9300";
			ctx.lineWidth = 2;
			ctx.setLineDash([4]);
			if(component["inputPort"]){ 
				// Render connections
				this.renderConnectionsToCanvas(ctx, component, offsetX, offsetY);
			}
		}
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
		ctx.setLineDash([0]);
		for(let component of components){ // Render ports (render them over connections)
			ctx.strokeStyle = "#df9300";
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

	private renderConnectionsToCanvas(ctx: CanvasRenderingContext2D, component: IDataOperator, offsetX: number, offsetY: number){
		for(let connection of (component["inputPort"] as Port).connections){
			let {width, height} = this.getComponentSize(component);

			ctx.strokeStyle = "#df9300";
			let comp2 = connection.getOtherPort(component["inputPort"]).parent;
			let comp2Size = this.getComponentSize(comp2);
			let comp2Width = comp2Size.width;
			let comp2Height = comp2Size.height;
			ctx.beginPath();
			ctx.moveTo(component.options.X - offsetX - 12, component.options.Y - offsetY + height/2);
			ctx.lineTo(comp2.options.X - offsetX + comp2Width + 12, comp2.options.Y - offsetY + comp2Height/2);
			ctx.stroke()
			ctx.closePath() 
		}
	}

	private renderComponentTitleToCanvas(ctx: CanvasRenderingContext2D, component: IDataOperator, offsetX: number, offsetY: number){
		let {width, height} = this.getComponentSize(component);
		ctx.fillStyle = '#c9c9c9'
		ctx.setLineDash([0]);
		ctx.font = 'normal 12px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'alphabetic'
		ctx.fillText(component.options.title, component.options.X - offsetX+width/2, component.options.Y - offsetY - 10)
	
	}

	private wrapSvgText(svg: SVGElement, text: string, x: number, y: number, maxWidth: number, maxHeight: number, lineHeight: number, fontSize: number, isBold = false, isItalic = false) {
        let line = '';
		let height = lineHeight;

		for(let letter of text){
			var newLine = line + letter;
			let newSvgLine = this.createSvgText(newLine, x, y, fontSize, isBold, isItalic);
			svg.appendChild(newSvgLine);
			let newWidth = newSvgLine.getComputedTextLength()
			svg.removeChild(newSvgLine);
			if(newWidth > maxWidth){
				let newText = this.createSvgText(line, x, y, fontSize, isBold, isItalic);
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
		let newText = this.createSvgText(line, x, y, fontSize, isBold, isItalic);
		svg.appendChild(newText);
	}

	private createSvgText(text, x, y, fontSize, isBold = false, isItalic = false){
		let textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
		textSvg.setAttributeNS(null,"x",(x).toString());     
		textSvg.setAttributeNS(null,"y",(y).toString()); 
		textSvg.setAttributeNS(null,"font-size",`${fontSize}px`);
		textSvg.setAttributeNS(null,"font-family",'Arial');
		textSvg.setAttributeNS(null,"font-weight",`${isBold ? "bold" : "normal"}`);
		textSvg.setAttributeNS(null,"font-style",`${isItalic ? "italic" : "normal"}`);
		textSvg.setAttributeNS(null,"fill",'#fff');
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
				rect.setAttributeNS(null, 'fill', '#222947');
				rect.setAttributeNS(null, 'stroke-width', '2');
				rect.setAttributeNS(null, 'stroke', '#101732');
				svg.appendChild(rect);
				this.wrapSvgText(svg, component.options.title,  component.options.X - offsetX + 3, component.options.Y - offsetY + component.options.fontSize + 3, component.options.width - 6, component.options.height - 6, component.options.fontSize, component.options.fontSize, component.options.isBold, component.options.isItalic);
			}
			else{
				let rect = document.createElementNS(this.svgns, 'rect');
				rect.setAttributeNS(null, 'x', (component.options.X - offsetX).toString());
				rect.setAttributeNS(null, 'y', (component.options.Y - offsetY).toString());
				rect.setAttributeNS(null, 'rx', "5");
				rect.setAttributeNS(null, 'ry', "5");
				rect.setAttributeNS(null, 'width', width.toString());
				rect.setAttributeNS(null, 'height', height.toString());
				rect.setAttributeNS(null, 'fill', '#080a1a');
				svg.appendChild(rect);
				let img = document.createElementNS(this.svgns,'image') as SVGImageElement;
				img.setAttributeNS(null,'height','26');
				img.setAttributeNS(null,'width','26');
				img.setAttributeNS('http://www.w3.org/1999/xlink','href', `https://honzaap.github.io/Systemizer/assets/${this.savingService.getComponentType(component).toLowerCase()}.svg`);
				img.setAttributeNS(null,'x', (component.options.X - offsetX + width/2 - 20 + 7).toString());
				img.setAttributeNS(null,'y', (component.options.Y - offsetY + height/2 - 20 + 7).toString());
				img.setAttributeNS(null, 'visibility', 'visible');
				
				svg.appendChild(img);
			}

			// Render title
			if(options.showTitles && !(component instanceof TextField)){
				this.renderComponentTitleToSvg(svg, component, offsetX, offsetY);
			}
			
			if(component["inputPort"]){ 
				this.renderConnectionsToSvg(svg, component, offsetX, offsetY);
			}
		}
		this.renderPortsToSvg(svg, components, offsetX, offsetY);
		return svg;
	}

	private renderPortsToSvg(svg: SVGElement, components: IDataOperator[], offsetX: number, offsetY: number){
		for(let component of components){ // Render ports (render then over connections)
			let {width, height} = this.getComponentSize(component);
			if(component["inputPort"] && component["inputPort"].connections.length > 0){ // Render input port
				let port = document.createElementNS(this.svgns,"circle");
				port.setAttribute("cx", (component.options.X - offsetX - 12).toString());
				port.setAttribute("cy", (component.options.Y - offsetY + height/2).toString());
				port.setAttribute("r", "7.5");
				port.setAttribute("fill", "#080a1a");
				port.setAttribute("stroke", "#df9300");
				port.setAttribute("stroke-width", "2");
				svg.appendChild(port);
			}
			if(component["outputPort"] && component["outputPort"].connections.length > 0){ // Render output port
				let port = document.createElementNS(this.svgns,"circle");
				port.setAttribute("cx", (component.options.X - offsetX + width + 12).toString());
				port.setAttribute("cy", (component.options.Y - offsetY + height/2).toString());
				port.setAttribute("r", "7.5");
				port.setAttribute("fill", "#080a1a");
				port.setAttribute("stroke", "#df9300");
				port.setAttribute("stroke-width", "2");
				svg.appendChild(port);
			}
		}
	}

	private renderConnectionsToSvg(svg: SVGElement, component: IDataOperator, offsetX: number, offsetY: number){
		// Render connections
		let {width, height} = this.getComponentSize(component);
		for(let connection of (component["inputPort"] as Port).connections){
			let comp1 = component;
			let comp2 = connection.getOtherPort(component["inputPort"]).parent;
			let comp2Size = this.getComponentSize(comp2);
			let comp2Width = comp2Size.width;
			let comp2Height = comp2Size.height;
			var newLine = document.createElementNS(this.svgns,'line');
			newLine.setAttribute('x1', (comp1.options.X - offsetX - 12).toString());
			newLine.setAttribute('y1', (comp1.options.Y - offsetY + height/2).toString());
			newLine.setAttribute('x2', (comp2.options.X - offsetX + comp2Width + 12).toString());
			newLine.setAttribute('y2', (comp2.options.Y - offsetY + comp2Height/2).toString());
			newLine.setAttribute("stroke", "#df9300");
			newLine.setAttribute("stroke-width", "2");
			newLine.setAttribute("stroke-linecap", "round");
			newLine.setAttribute("stroke-dasharray", "3");
			svg.appendChild(newLine);
		}
	}

	private renderComponentTitleToSvg(svg: SVGElement, component: IDataOperator, offsetX: number, offsetY: number){
		let {width, height} = this.getComponentSize(component);
		let newText = this.createSvgText(component.options.title, component.options.X - offsetX+width/2, component.options.Y - offsetY - 10, 12);
		newText.setAttributeNS(null,"text-anchor",'middle');
		newText.setAttributeNS(null,"fill",'#c9c9c9');
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
}

export class ExportSvgOptions{
	showTitles: boolean = true;
}