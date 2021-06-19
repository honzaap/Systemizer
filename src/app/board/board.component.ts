import { EventEmitter, Output, ViewContainerRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { download } from 'src/shared/ExtensionMethods';
import { PlacingService } from '../placing.service';
import { SelectionService } from '../selection.service';
import { ApiComponent } from './components/api/api.component';
import { ApiGatewayComponent } from './components/apigateway/apigateway.component';
import { CacheComponent } from './components/cache/cache.component';
import { ClientComponent } from './components/client/client.component';
import { DatabaseComponent } from './components/database/database.component';
import { LoadbalancerComponent } from './components/loadbalancer/loadbalancer.component';
import { MessagequeueComponent } from './components/messagequeue/messagequeue.component';
import { PortComponent } from './components/port/port.component';
import { PubsubComponent } from './components/pubsub/pubsub.component';
import { OperatorComponent } from './components/Shared/OperatorComponent';
import { TextfieldComponent } from './components/textfield/textfield.component';
import { WebserverComponent } from './components/webserver/webserver.component';


@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

	board : HTMLElement;
	posX = 0;
	posY = 48;

	scaleControl: FormControl = new FormControl();
	scaleSelectList = [0.1, 0.5, 1, 1.5, 2];
	isLoading = false;
	isSaving = false;
	saveFileName: string = "";
	systemName: string = "";
	constructor(private placingService : PlacingService, private selectionService: SelectionService, private snackBar: MatSnackBar) { }

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	@Output() changeSystemName = new EventEmitter();

	allLogicComponents: IDataOperator[] = [];
	allComponents: OperatorComponent[] = [];
	
	scroll(event){
		if(event.deltaY < 0)
			this.zoomIn();
		else
			this.zoomOut();
	}

	ngOnInit(): void {
		window.addEventListener("resize", event => {
			event.preventDefault();
		});

		this.board = document.getElementById("board");
		this.board.style.width = "2000px";
		this.board.style.height = "1000px";

		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;

		this.board.addEventListener("mouseup",(e)=>{
			if(this.placingService.isCreating){
				let component = this.placingService.createComponent(this.placingService.creatingItem, e.offsetX - 20, e.offsetY - 20, this.placingService.creatingItemOptions);
				if(component != null){ // Add component to list
					let logicComponent = component.getLogicComponent();
					this.allLogicComponents.push(logicComponent);
					this.allComponents.push(component);
				}
				this.placingService.stopCreating();
			}
		})

		window.onkeydown = (e:KeyboardEvent)=>{
			if(e.ctrlKey){
				if(e.key == "c")
					this.copyItem()
				else if(e.key == "v")
					this.pasteItem();
				else if(e.key == "x") { }
			}
			if(e.key === 'Delete')
				this.delete();
		}
		this.scaleControl.setValue(1);
	}

	copyItem(){
		if(this.selectionService.currentSelection != null)
			this.placingService.copyItem(this.selectionService.currentSelection.constructor, this.selectionService.currentSelection.getLogicComponent().options);
	}

	pasteItem(){
		let component = this.placingService.pasteItem();
		if(component != null){ // Add component to list
			let logicComponent = component.getLogicComponent();
			this.allLogicComponents.push(logicComponent);
			this.allComponents.push(component);
		}
	}

	ngAfterViewInit(){
		this.placingService.connectionRef = this.conn;
		this.placingService.snackBar = this.snackBar;
	}

	public handleMousedown( event: Event ) : void {
		if(!this.placingService.canDrag()) 
			return;

		this.board.addEventListener( "mousemove", this.handleMousemove );
		window.addEventListener( "mouseup", this.handleMouseup );
	}

	public handleMousemove = ( event: MouseEvent ): void => {
		this.posX += event.movementX;
		this.posY += event.movementY;
		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;
	}

	public handleMouseup = (e) : void => {
		this.board.removeEventListener( "mousemove", this.handleMousemove );
		window.removeEventListener( "mouseup", this.handleMouseup );
	}

	public handleClick = (event: MouseEvent) : void => {
		if(this.placingService.isConnecting){
			this.placingService.stopConnecting();
			this.board.onmousemove = null;
			document.getElementsByClassName("svg-canvas")[0].innerHTML = "";
		}
	}

	public handleSelfClick(){
		this.selectionService.clearSelection();
		this.selectionService.clearConnectionSelection();
	}

	handleScaleChange(){
		this.placingService.boardScale = this.scaleControl.value;
		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;
	}

	zoomOut(){
		this.placingService.boardScale = Math.max(this.placingService.boardScale - 0.1,0.1) ;
		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;
	}

	zoomIn(){
		this.placingService.boardScale = Math.min(this.placingService.boardScale + 0.1,2);
		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;
	}

	delete(){
		let component = this.selectionService.currentSelection; 
		if(component != null){ // Delete component from list
			let logicComponent = component.getLogicComponent();
			this.allComponents.splice(
				this.allComponents.findIndex(comp => comp === component)
			,1);
			this.allLogicComponents.splice(
				this.allLogicComponents.findIndex(comp => comp.originID == logicComponent.originID)
			,1);
		}
		this.selectionService.deleteSelection();
	}

	saveFile(name: string){
		this.isSaving = true;
		this.saveFileName = name;
		this.systemName = name;
	}

	saveJson(){
		if(this.allLogicComponents.length == 0){
			this.placingService.showSnack("There is nothing to save...");
			return;
		}
		let result = this.getBoardJson();
		if(result.error)
			this.placingService.showSnack("There were errors saving the file and some components couldn't be saved.")
		let json = result.json;
		let file = `{"name": "${this.systemName}", "components": ${json}}`;
		download(`${this.saveFileName}.json`, file);	
	}

	getBoardJson(){
		let jsonReadyComponents = [];
		let wasError = false;
		for(let component of this.allLogicComponents){
			// If one component fails, dont fail the whole operation, tell the user there were errors instead
			try{ 
				let jsonReadyComponent: any = {};
				jsonReadyComponent.type = component.constructor.name;
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
		return {json: jsonComponents, error: wasError};
	}

	loadFromJson(json: string){
		this.clearBoard();
		this.isLoading = true;
		let wasError = false;
		try{
			let file = JSON.parse(json);
			let components: any[];
			if(file.components)
				components = file.components;
			else
				components = file;
			if(file.name)
				this.changeSystemName.emit(file.name);
			let connectionTable: any[] = [];
			let index = 0;
			for(let logicComponent of components){
				let type = this.getComponentTypeFromName(logicComponent.type);
				if(type == null || logicComponent.options == null){
					wasError = true;
					if(index == components.length - 1){
						this.connectLoadedComponents(connectionTable);
					}
					index++;
					continue;
				}
				let left = logicComponent.options.X;
				let top = logicComponent.options.Y;
				let component = this.placingService.createComponent(type as any, left, top, logicComponent.options);
				this.allComponents.push(component);
				this.allLogicComponents.push(component.getLogicComponent());
				const currentComponentIndex = index;
				component.onViewInit = () => {
					let outputPort = component.getPortComponent(true);
					let inputPort = component.getPortComponent(false);
					if(outputPort != null){
						let connection: any = {};
						connection.port = outputPort;
						connection.id = logicComponent.id;
						connection.to = logicComponent.connections.filter(c => c.isFromOutput).map(c => c.to);
						connection.isFromOutput = outputPort.IsOutput;
						connectionTable.push(connection);
					}
					if(inputPort != null){
						let connection: any = {};
						connection.port = inputPort;
						connection.id = logicComponent.id;
						connection.to = logicComponent.connections.filter(c => c.isToOutput).map(c => c.to);
						connection.isFromOutput = inputPort.IsOutput;
						connectionTable.push(connection);
					}
					if(currentComponentIndex == components.length - 1){
						this.connectLoadedComponents(connectionTable);
					}
				}
				index++;
			}
		}
		catch{
			this.placingService.showSnack("This file could not be loaded because it is corrupted or not supported.")
			setTimeout(()=>{
				this.isLoading = false;
			}, 100);
			return;
		}
		if(wasError)
			this.placingService.showSnack("There were errors loading the file and some components couldn't be loaded.")
	}

	connectLoadedComponents(connectionTable: any[]){
		for(let connection of connectionTable){
			connection.to.forEach(id => {
				connectionTable.filter(con => con.id === id && connection.isFromOutput != con.isFromOutput).forEach(con => {
					this.placingService.connectPorts(connection.port, con.port);
				})
			})
		}
		setTimeout(()=>{
			this.isLoading = false;
		}, 100);
	}

	clearBoard(){
		for(let component of this.allComponents){
			this.selectionService.currentSelection = component;
			try{ // Deleting element while sending data could throw error
				this.selectionService.deleteSelection();
			}
			catch{}
		}
		this.allComponents = [];
		this.allLogicComponents = [];
	}

	getComponentTypeFromName(name: string){
		switch(name){
			case "Client":
				return ClientComponent;
			case "API":
				return ApiComponent;
			case "APIGateway":
				return ApiGatewayComponent;
			case "Cache":
				return CacheComponent;
			case "Database":
				return DatabaseComponent;
			case "LoadBalancer":
				return LoadbalancerComponent;
			case "MessageQueue":
				return MessagequeueComponent;
			case "PubSub":
				return PubsubComponent;
			case "TextField":
				return TextfieldComponent;
			case "WebServer":
				return WebserverComponent;
		}
		return null;
	}

	test: string = "";
}