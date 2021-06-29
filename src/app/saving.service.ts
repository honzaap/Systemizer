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

@Injectable({
  	providedIn: 'root'
})
export class SavingService {

	LOCALSTORAGE_AUTOSAVE_KEY = "board_autosave";
	systemName: string = "Untitled system";

	constructor() { }

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
}
