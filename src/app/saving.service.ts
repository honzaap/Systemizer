import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { API } from 'src/models/API';
import { APIGateway } from 'src/models/APIGateway';
import { Client } from 'src/models/Client';
import { Cache } from 'src/models/Cache';
import { Database } from 'src/models/Database';
import { LoadBalancer } from 'src/models/LoadBalancer';
import { MessageQueue } from 'src/models/MessageQueue';
import { PubSub } from 'src/models/PubSub';
import { TextField } from 'src/models/TextField';
import { WebServer } from 'src/models/WebServer';
import { CloudStorage } from 'src/models/CloudStorage';
import html2canvas from 'html2canvas';
import { Port } from 'src/models/Port';
import { PlacingService } from './placing.service';

@Injectable({
  	providedIn: 'root'
})
export class SavingService {

	LOCALSTORAGE_AUTOSAVE_KEY = "board_autosave";
	systemName: string = "Untitled system";

	constructor(private placingService: PlacingService) { }

  	getBoardJson(allLogicComponents: IDataOperator[], systemName: string){
		let jsonReadyComponents = [];
		let wasError = false;
		for(let component of allLogicComponents){
			// If one component fails, dont fail the whole operation, tell the user there were errors instead
			try{ 
				let jsonReadyComponent: any = {};
				jsonReadyComponent.type = this.getComponentType(component);
				jsonReadyComponent.id = component.originID;
				jsonReadyComponent.options = component.options;
				jsonReadyComponent.connections = [];
				let inputPort = component.getPort(false);
				let outputPort = component.getPort(true);
				if(inputPort != null){ // Get all connections from inputPort to JSON ready form
					for(let connection of inputPort.connections){
						let jsonReadyConnection: any = {};
						jsonReadyConnection.isFromOutput = false;
						jsonReadyConnection.from = jsonReadyComponent.id;
						let connectedCompoent = connection.getOtherPort(inputPort).parent;
						jsonReadyConnection.to = connectedCompoent.originID;
						jsonReadyConnection.isToOutput = connection.getOtherPort(inputPort).isOutput;
						jsonReadyComponent.connections.push(jsonReadyConnection);
					}
				}
				if(outputPort != null){ // Get all connections from outputPort to JSON ready form
					for(let connection of outputPort.connections){
						let jsonReadyConnection: any = {};
						jsonReadyConnection.isFromOutput = true;
						jsonReadyConnection.from = jsonReadyComponent.id;
						let connectedCompoent = connection.getOtherPort(outputPort).parent;
						jsonReadyConnection.to = connectedCompoent.originID;
						jsonReadyConnection.isToOutput = connection.getOtherPort(outputPort).isOutput;
						jsonReadyComponent.connections.push(jsonReadyConnection);
					}
				}
				jsonReadyComponents.push(jsonReadyComponent);
			}
			catch(e){
				wasError = true;
				continue;
			}
		}
		let jsonComponents = JSON.stringify(jsonReadyComponents);
		let file = `{"name": "${systemName}", "components": ${jsonComponents}}`;
		return file;
	}

	private getComponentType(component: any){ // constructor.name doesn't work in prod if sourceMap isn't turned on
		if(component instanceof API)
			return "API";
		else if(component instanceof APIGateway)
			return "APIGateway";
		else if(component instanceof Client)
			return "Client";
		else if(component instanceof Cache)
			return "Cache";
		else if(component instanceof CloudStorage)
			return "CloudStorage"
		else if(component instanceof Database)
			return "Database";
		else if(component instanceof LoadBalancer)
			return "LoadBalancer";
		else if(component instanceof MessageQueue)
			return "MessageQueue";
		else if(component instanceof PubSub)
			return "PubSub";
		else if(component instanceof WebServer)
			return "WebServer";
		else if(component instanceof TextField)
			return "TextField";
		return "Client";
	}

	save(allLogicComponents: IDataOperator[]){
		localStorage.setItem(this.LOCALSTORAGE_AUTOSAVE_KEY, this.getBoardJson(allLogicComponents, this.systemName));
	}

	async getCanvas(components: IDataOperator[], options: ExportPngOptions){
		if(components.length == 0)
			return null;
		let canvas = document.createElement("canvas");
		document.getElementsByTagName("body")[0].appendChild(canvas);
		canvas.width = this.placingService.boardWidth;
		canvas.height = this.placingService.boardHeight;
		let offsetX = 0;
		let offsetY = 0;
		if(options.captureUsed){ // Crop the board
			let minX = canvas.width;
			let minY = canvas.height;
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
					width = component instanceof MessageQueue ? 80 : 40;
					height = component instanceof APIGateway ? 80 : 40;
				}
				
				if(minX > component.options.X)
					minX = component.options.X;
				if(minY > component.options.Y)
					minY = component.options.Y;
				if(maxX < component.options.X + width)
					maxX = component.options.X + width;
				if(maxY < component.options.Y + height)
					maxY = component.options.Y + height;
			}	
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
			let width = component instanceof MessageQueue ? 80 : 40;
			let height = component instanceof APIGateway ? 80 : 40;
	
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
				this.wrapText(ctx, component.options.title, component.options.X - offsetX + 3, component.options.Y - offsetY + component.options.fontSize + 3,  component.options.width - 6, component.options.height - 6, component.options.fontSize+3)
			}
			else{
				ctx.fillRect(component.options.X - offsetX, component.options.Y - offsetY, width, height);
				let img = new Image();
				await new Promise(r => {img.onload=r ; img.src=`./assets/${this.getComponentType(component).toLowerCase()}.svg`});
				ctx.drawImage(img, component.options.X - offsetX + width/2 - 20 + 7, component.options.Y - offsetY + height/2 - 20 + 7, 26, 26);
			}

			// Render title
			if(options.showTitles && !(component instanceof TextField)){
				ctx.fillStyle = '#c9c9c9'
				ctx.setLineDash([0]);
				ctx.font = 'normal 12px Arial'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'alphabetic'
				ctx.fillText(component.options.title, component.options.X - offsetX+width/2, component.options.Y - offsetY - 10)
			}
			
			ctx.fillStyle = '#080a1a'
			ctx.strokeStyle = "#df9300";
			ctx.lineWidth = 2;
			ctx.setLineDash([4]);
			if(component["inputPort"]){ // Render input port
				// Render connections
				for(let connection of (component["inputPort"] as Port).connections){
					ctx.strokeStyle = "#df9300";
					let comp1 = component;
					let comp2 = connection.getOtherPort(component["inputPort"]).parent;
					let comp2Width = comp2 instanceof MessageQueue ? 80 : 40;
					let comp2Height = comp2 instanceof APIGateway ? 80 : 40;
					ctx.beginPath();
					ctx.moveTo(comp1.options.X - offsetX - 12, comp1.options.Y - offsetY + height/2);
					ctx.lineTo(comp2.options.X - offsetX + comp2Width + 12, comp2.options.Y - offsetY + comp2Height/2);
					ctx.stroke()
					ctx.closePath() 
				}
			}
		}
		ctx.setLineDash([0]);
		for(let component of components){ // Render ports (render then over connections)
			ctx.strokeStyle = "#df9300";
			ctx.lineWidth = 2;
			let width = component instanceof MessageQueue ? 80 : 40;
			let height = component instanceof APIGateway ? 80 : 40;
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
		return canvas;
	}

	private wrapText(context, text, x, y, maxWidth, maxHeight, lineHeight) {
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
}

export class ExportPngOptions{
	captureUsed: boolean = false; // Capture only used part of board instead of the whole board
	transparentBackground: boolean = false;
	showTitles: boolean = true;
}