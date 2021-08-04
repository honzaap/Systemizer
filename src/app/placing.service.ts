import { ComponentFactory, ComponentFactoryResolver, ComponentRef, EventEmitter, Injectable, Output, Type, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { LineBreak } from 'src/models/Connection';
import { Options } from 'src/models/Options';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { PortComponent } from './board/components/port/port.component';
import { OperatorComponent } from './board/components/Shared/OperatorComponent';

class CopiedItem {
	component: any;
	logicComponent: IDataOperator;
	options: Options;
	outputConnectionsList: any[];
}

@Injectable({
  	providedIn: 'root'
})
export class PlacingService{

	@Output() componentChanged = new EventEmitter();
	@Output() showComponentConextMenu = new EventEmitter<any>();
	@Output() pushComponent = new EventEmitter<OperatorComponent>();

	isPlacing = false;
	isConnecting = false;
	canMoveConnection = true;
	isCreating = false;

	boardWidth = 2000;
	boardHeight = 1000;

	connectingPort : PortComponent;
	connectionRef : ViewContainerRef;
	snackBar: MatSnackBar;

	canDrag = () => { 
		return !this.isPlacing && !this.isConnecting 
	};

	boardScale = 1;

	creatingItem: any;
	creatingItemOptions: any;

	copiedItems: CopiedItem[] = [];

	startCreating(creatingItem: any, options: any){
		this.isCreating = true;
		this.creatingItem = creatingItem;
		this.creatingItemOptions = options;
	}

	stopCreating(){
		this.isCreating = false;
		this.creatingItem = null;
		this.creatingItemOptions = null;
	}

	startPlacing(){
		this.isPlacing = true;
	}

	stopPlacing(){
		this.isPlacing = false;
	}

	startConnecting(portComponent: PortComponent){
		let board = document.getElementById("board");
		board.classList.remove("infocus");
		this.isConnecting = true;
		this.connectingPort = portComponent;
	}

	stopConnecting(){
		let board = document.getElementById("board");
		board.classList.add("infocus");
		board.onmousemove = null;
		this.isConnecting = false;
		this.connectingPort = null;
	}

	showSnack(message: string){
		this.snackBar.open(message,"×", {
			duration: message.length * 115,
			horizontalPosition: "right",
		});
	}

	copyItems(items: CopiedItem[]){
		if(items.length == 0)
			return;
		this.copiedItems = items;
	}

	pasteItem(x: number = -1, y: number = -1){
		let components = [];
		let connectionsList = [];
		for(let item of this.copiedItems){
			connectionsList = connectionsList.concat(item.outputConnectionsList);
		}

		let minX = Number.MAX_VALUE;
		let minY = Number.MAX_VALUE;
		let maxX = -1;
		let maxY = -1;

		this.copiedItems.forEach(item => {
			minX = Math.min(item.options.X, minX);
			minY = Math.min(item.options.Y, minY);
			maxX = Math.max(item.options.X + 80, maxX);
			maxY = Math.max(item.options.Y + 80, maxY);
		})

		let width = maxX - minX;
		let height = maxY - minY;

		let pasteOriginX = Math.min(x < 0 ? maxX + 40 : x + width, this.boardWidth);
		let pasteOriginY = Math.min(y < 0 ? maxY + 40 : y + height, this.boardHeight);

		for(let item of this.copiedItems){
			let options = item.options;

			let pasteX = pasteOriginX - width + (options.X - minX)
			let pasteY = pasteOriginY - height + (options.Y - minY)
	
			let component = this.createComponent(item.component, pasteX, pasteY, options);
			connectionsList = connectionsList.map(conn => {
				if(conn.from === item.logicComponent.originID){
					return {
						from: component.getLogicComponent().originID,
						to: conn.to,
						lineBreaks: conn.lineBreaks,
						title: conn.title
					}
				}
				else if(conn.to === item.logicComponent.originID){
					return {
						from: conn.from,
						to: component.getLogicComponent().originID,
						lineBreaks: conn.lineBreaks,
						title: conn.title
					}
				}
				return conn;
			})
			components.push(component);
		}
		for(let connection of connectionsList){

			let comp1 = components.find(comp => comp.getLogicComponent().originID == connection.from);
			let comp2 = components.find(comp => comp.getLogicComponent().originID == connection.to);

			if(comp1 && comp2){
				let comp1Initiated = false;
				let comp2Initiated = false;
				comp1.onViewInit.push(()=> {
					comp1Initiated = true;
					if(comp2Initiated){
						this.connectPorts(comp1.getPortComponent(true), comp2.getPortComponent(false), 
						false, connection.lineBreaks.map(br => {return {x: pasteOriginX - width + (br.x - minX),y: pasteOriginY - height + (br.y - minY) }}), connection.title);
					}
				})
				comp2.onViewInit.push(()=> {
					comp2Initiated = true;
					if(comp1Initiated){
						this.connectPorts(comp1.getPortComponent(true), comp2.getPortComponent(false), 
						false, connection.lineBreaks.map(br => {return {x: pasteOriginX - width + (br.x - minX),y: pasteOriginY - height + (br.y - minY) }}), connection.title);
					}
				})
			}
		}
		return components;
	}

	connectPorts(portComponent1: PortComponent, portComponent2: PortComponent, isReadOnly: boolean = false, lineBreaks: LineBreak[] = [], title: string = ""){
		let factory : ComponentFactory<ConnectionComponent> = this.resolver.resolveComponentFactory(ConnectionComponent);
		let c : ComponentRef<ConnectionComponent>  = this.connectionRef.createComponent(factory);

		let logicConn = portComponent1.LogicPort.parent.connectTo(portComponent2.LogicPort.parent, portComponent1.IsOutput, portComponent2.IsOutput);
		if(logicConn == null){
			c.destroy();
			return false;
		}
		logicConn.lineBreaks = lineBreaks;
		logicConn.title = title;
		c.instance.LogicConnection = logicConn;
		c.instance.isReadOnly = isReadOnly;

		c.instance.destroyComponent = () => {
			c.destroy();
		}

		c.instance.portComponent1 = portComponent1;
		c.instance.portComponent2 = portComponent2;

		return true
	}

	public createComponent<T>(component: Type<T>, left = 100, top = 100, options: any, isReadOnly: boolean = false) {
		if(component == null) 
			return;
		let factory  = this.resolver.resolveComponentFactory(component);
		let c : any = this.connectionRef.createComponent(factory);
		c.instance.isReadOnly = isReadOnly;
		let comp = c.instance.getLogicComponent();

		c.instance.destroyComponent = () => {
			c.destroy();
		}

		if(options != null){
			for(let key of Object.keys(options)){
				comp.options[key] = options[key];
			}
		}
		
		c.instance.hasChanged.subscribe(()=>{
			this.componentChanged.emit();
		})
		c.instance.showContextMenu.subscribe((e)=>{
			this.showComponentConextMenu.emit({
				x: c.instance.getLogicComponent().options.X + e.offsetX,
				y: c.instance.getLogicComponent().options.Y + e.offsetY,
			});
		})

		comp.options.X = left;
		comp.options.Y = top;

		return c.instance;
	}

	constructor(private resolver: ComponentFactoryResolver) {
	}
}
