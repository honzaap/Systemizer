import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { API } from 'src/models/API';
import { APIGateway } from 'src/models/APIGateway';
import { Cache } from 'src/models/Cache';
import { Client } from 'src/models/Client';
import { ClientCluster } from 'src/models/ClientCluster';
import { CloudStorage } from 'src/models/CloudStorage';
import { Database } from 'src/models/Database';
import { LoadBalancer } from 'src/models/LoadBalancer';
import { MessageQueue } from 'src/models/MessageQueue';
import { Options } from 'src/models/Options';
import { Port } from 'src/models/Port';
import { Proxy } from 'src/models/Proxy';
import { PubSub } from 'src/models/PubSub';
import { TextField } from 'src/models/TextField';
import { WebServer } from 'src/models/WebServer';

@Injectable({
  	providedIn: 'root'
})
export class SavingService {

	LOCALSTORAGE_AUTOSAVE_KEY = "board_autosave";
	LOCALSTORAGE_BOARDS_KEY = "all_saved_boards";
	systemName: string = "Untitled system";

	types = {
		API,
		APIGateway,
		Client,
		Cache,
		CloudStorage,
		Database,
		LoadBalancer,
		MessageQueue,
		PubSub,
		WebServer,
		TextField,
		Proxy,
		ClientCluster
	}

	constructor() { }

	getBoardSave(allLogicComponents: IDataOperator[], systemName: string, id: string){
		let jsonReadyComponents = [];
		for(let component of allLogicComponents){
			// If one component fails, dont fail the whole operation, tell the user there were errors instead
			try{ 
				let jsonReadyComponent: any = {};
				jsonReadyComponent.type = this.getComponentType(component);
				jsonReadyComponent.id = component.originID.slice(0, 6);
				jsonReadyComponent.options = this.cloneOptions(component.options);
				jsonReadyComponent.connections = [];
				let inputPort = component.getPort(false);
				if(inputPort != null){ // Get all connections from inputPort to JSON ready form
					for(let connection of inputPort.connections){
						let jsonReadyConnection: any = {};
						jsonReadyConnection.from = jsonReadyComponent.id;
						let connectedCompoent = connection.getOtherPort(inputPort).parent;
						jsonReadyConnection.to = connectedCompoent.originID.slice(0, 6);
						jsonReadyComponent.connections.push(jsonReadyConnection);
					}
				}
				jsonReadyComponents.push(jsonReadyComponent);
			}
			catch(e){
				continue;
			}
		}
		return 	{
			name: systemName, 
			id: id || "",
			components: jsonReadyComponents
		}
	}

  	getBoardJson(allLogicComponents: IDataOperator[], systemName: string, id: string){
		let jsonReadySave = this.getBoardSave(allLogicComponents, systemName, id);
		return JSON.stringify(jsonReadySave);
	}

	/**
	 * Takes in array of components that was made by getBoardSave method
	 */
	getComponentsFromSave(save: any[]): IDataOperator[]{
		let components = [];
		let outputsTable = {}
		let connectionTable = []
		for(let component of save){
			let logicComponent: IDataOperator = new this.types[component.type];

			for(let key of Object.keys(component.options)){
				logicComponent.options[key] = component.options[key];
			}
			if(component instanceof Database && component.options.isMasterShard){
				component.outputPort = new Port(component, true, true);
			}
			let outputPort = logicComponent.getPort(true);
			let inputPort = logicComponent.getPort(false);
			if(outputPort){
				outputsTable[component.id] = logicComponent;
			}
			if(inputPort){
				let connection: any = {};
				connection.component = logicComponent;
				connection.id = logicComponent.originID;
				connection.to = component.connections;
				connectionTable.push(connection);
			}
			components.push(logicComponent);
		}
		for(let connection of connectionTable){
			connection.to.filter(con => con.isFromOutput == null || !con.isFromOutput).forEach(con => {
				if(outputsTable[con.to])
					connection.component.connectTo(outputsTable[con.to], false, true);
			});
		}
		return components;
	}

	public getComponentType(component: any){ 
		return Object.keys(this.types).find(type => component instanceof this.types[type]) || "Client";
	}

	save(allLogicComponents: IDataOperator[], id: string){
		localStorage.setItem(this.LOCALSTORAGE_AUTOSAVE_KEY, this.getBoardJson(allLogicComponents, this.systemName, id));
	}

	getLatestBoardJson(){
		return localStorage.getItem(this.LOCALSTORAGE_AUTOSAVE_KEY);
	}

	getSavedBoardsJson(){
		return localStorage.getItem(this.LOCALSTORAGE_BOARDS_KEY);
	}

	/**
	 * Saves array of save objects from getBoardSave method
	 */
	saveBoards(boards: any[]){
		localStorage.setItem(this.LOCALSTORAGE_BOARDS_KEY, JSON.stringify(boards));
	}

	
	/**
	 * Returns new object that represents options of given component normalized for saving
	 */
	private cloneOptions(options: Options): any {
		var cloneObj = new (options.constructor as any);
		for (var attribut in options) {
			if(options[attribut] != null && options[attribut].endpoint != null && options[attribut].method != null){
				cloneObj[attribut] = {
					endpoint: {url: options[attribut].endpoint.url, supportedMethods: options[attribut].endpoint.supportedMethods },
					method: options[attribut].method
				};
			}
			else if (typeof options[attribut] === "object" && options[attribut] != null)
				cloneObj[attribut] = this.cloneOptions(options[attribut]);
			else
				cloneObj[attribut] = options[attribut];
		}
		return cloneObj;
	}
}