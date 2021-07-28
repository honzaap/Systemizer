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
import { CDN } from 'src/models/CDN';

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
		ClientCluster,
		CDN
	}

	/**
	 * Dictionary of names that are converted to 1-3 letter names
	 */
	 optimizedBoardNames = {
		t: "type",
		i: "id",
		tt: "title",
		te: "technology",
		o: "options",
		p: "protocol",
		c: "connections",
		es: "endpoints",
		e: "endpoint",
		eR: "endpointRef",
		u: "url",
		sM: "supportedMethods",
		m: "method",
		as: "actions",
		gM: "grpcMode",
		iCn: "isConsumer",
		iSb: "isSubscriber",
		rEp: "restEndpoints",
		rpEp: "rpcEndpoints",
		gEp: "graphqlEndpoints",
		gpEp: "grpcEndpoints",
		wEp: "websocketsEndpoints",
		ag: "algorithm",
		rPl: "replacementPolicy",
		wPl: "writePolicy",
		w: "width",
		h: "height",
		fS: "fontSize",
		iB: "isBold",
		iI: "isItalic",
		iMs: "isMasterShard",
		iS: "isShard",
		bg: "backgroundColor",
		co: "color"
	};

	/**
	 * Dictionary of types that are converted to 1-3 letter names
	 */
	optimizedComponentTypes = {
		A: "API",
		AG: "APIGateway",
		C: "Client",
		CC: "ClientCluster",
		CA: "Cache",
		CS: "CloudStorage",
		D: "Database",
		LB: "LoadBalancer",
		MQ: "MessageQueue",
		P: "Proxy",
		PS: "PubSub",
		TF: "TextField",
		WS: "WebServer",
		CD: "CDN"
	};

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

	getOptimizedBoardJson(allLogicComponents: IDataOperator[]){
		let save = this.getBoardSave(allLogicComponents, "", "");
		if(save.id)
			delete save.id; // Save ID is unnecesarry
		for(let component of save.components){
			component.i = component.id.slice(0, 5);  // Slicing ID's to only 5 characters
			delete component.id;
			component.t = Object.keys(this.optimizedComponentTypes).find(
				key => this.optimizedComponentTypes[key] == component.type
			); // Optimize type
			delete component.type;
			let optimizedConnections = []
			for(let connection of component.connections){ 
				optimizedConnections.push(
					[ 
						connection.from.slice(0, 5),
						connection.to.slice(0, 5)
					]
				)
			}
			if(optimizedConnections.length == 0)
				delete component.connections
			else{
				component.c = optimizedConnections;
				delete component.connections;
			}
			component.o = this.cloneOptionsOptimized(component.options);
			delete component.options;
		}
		let saveJson = JSON.stringify(save.components);
		return saveJson;
	}

	/**
	 * Takes in optimized save string that was made by getOptimizedBoardSave method
	 */
	getSaveFromOptimizedJson(saveJson: string){
		let save = JSON.parse(saveJson);
		for(let component of save){
			component.type = this.optimizedComponentTypes[component.t]
			component.options = this.getOptionsFromOptimized(component.o);
			component.id = component.i;
			let normalConnections = []
			if(component.c != null){
				for(let connection of component.c){ 
					normalConnections.push(
						{
							from: connection[0],
							to: connection[1]
						}
					)
				}
			}
			component.connections = normalConnections;
			delete component.o;
			delete component.i;
			delete component.c;
			delete component.t;
		}
		return save;
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

	cloneOptionsOptimized(options: any){
		var cloneObj = new (options.constructor as any);
		for (var attribut in options) {
			let opt = Object.keys(this.optimizedBoardNames).find(
				key => this.optimizedBoardNames[key] === attribut
			); // Optimize type
			if(opt){
				if (typeof options[attribut] === "object" && options[attribut] != null)
					cloneObj[opt] = this.cloneOptionsOptimized(options[attribut]);
				else
					cloneObj[opt] = options[attribut];
				delete cloneObj[attribut];
			}
			else{
				if (typeof options[attribut] === "object" && options[attribut] != null)
					cloneObj[attribut] = this.cloneOptionsOptimized(options[attribut]);
				else
					cloneObj[attribut] = options[attribut];
			}
		}
		return cloneObj;
	}

	getOptionsFromOptimized(options: any){
		let cloneObj = new (options.constructor as any);
		for (var attribut in options) {
			let opt = this.optimizedBoardNames[attribut]
			if(opt){
				if (typeof options[attribut] === "object" && options[attribut] != null)
					cloneObj[opt] = this.getOptionsFromOptimized(options[attribut]);
				else
					cloneObj[opt] = options[attribut];
			}
			else{
				if (typeof options[attribut] === "object" && options[attribut] != null)
					cloneObj[attribut] = this.getOptionsFromOptimized(options[attribut]);
				else
					cloneObj[attribut] = options[attribut];
			}

		}
		return cloneObj;
	}
}