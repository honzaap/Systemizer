import { ComponentFactory, ComponentFactoryResolver, ComponentRef, EventEmitter, Injectable, Output, Type, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Options } from 'src/models/Options';
import { clone } from 'src/shared/ExtensionMethods';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { PortComponent } from './board/components/port/port.component';
import { OperatorComponent } from './board/components/Shared/OperatorComponent';

class CopiedItem {
	component: any;
	options: Options;
}

@Injectable({
  	providedIn: 'root'
})
export class PlacingService{

	@Output() componentChanged = new EventEmitter();
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

	copiedItem: any;
	copiedItemOptions: any;
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

	copyItem(item: any, options: any){
		if(item == null) 	
			return;
		this.copiedItem = item;
		this.copiedItemOptions = options;
	}

	copyItems(items: CopiedItem[]){
		if(items.length == 0)
			return;
		this.copiedItems = items;
	}

	pasteItem(){
		let components = [];
		for(let component of this.copiedItems){
			let options = clone(component.options);

			let pasteX = Math.min(options.X + 40, this.boardWidth - 40);
			let pasteY = Math.min(options.Y + 40, this.boardHeight - 40);
	
			components.push(this.createComponent(component.component, pasteX, pasteY, options));
		}
		return components;
	}

	connectPorts(portComponent1: PortComponent, portComponent2: PortComponent, isReadOnly: boolean = false){
		let factory : ComponentFactory<ConnectionComponent> = this.resolver.resolveComponentFactory(ConnectionComponent);
		let c : ComponentRef<ConnectionComponent>  = this.connectionRef.createComponent(factory);
		
		let logicConn = portComponent1.LogicPort.parent.connectTo(portComponent2.LogicPort.parent, portComponent1.IsOutput, portComponent2.IsOutput);
		if(logicConn == null){
			c.destroy();
			return false;
		}
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

		comp.options.X = left;
		comp.options.Y = top;

		return c.instance;
	}

	constructor(private resolver: ComponentFactoryResolver) {
	}
}
