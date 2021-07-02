import { ComponentFactory, ComponentFactoryResolver, ComponentRef, EventEmitter, Injectable, Output, Type, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { clone } from 'src/shared/ExtensionMethods';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { PortComponent } from './board/components/port/port.component';

@Injectable({
  	providedIn: 'root'
})
export class PlacingService{

	@Output() componentChanged = new EventEmitter();

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

	pasteItem(boardPositionX = 0, boardPositionY = 0){
		if(this.copiedItem != null){
			let options = clone(this.copiedItemOptions);

			let shiftX = boardPositionX; // Position of board from left side of screen in pixels
			let shiftY = boardPositionY; // Position of board from top of screen in pixels

			let xPerScale = this.boardWidth / 20; // How much does X shift per every 0.1 of scale
			let yPerScale = this.boardHeight / 20; // How much does Y shift per every 0.1 of scale

			let windowX = window.innerWidth; // Window X size
			let windowY = window.innerHeight; // Window Y size

			if(this.boardScale > 1){
				shiftX = boardPositionX - Math.round(Math.abs(1 - this.boardScale) * 10) * xPerScale;
				shiftY = boardPositionY - Math.round(Math.abs(1 - this.boardScale) * 10) * yPerScale;
			}
			else if(this.boardScale < 1){
				shiftX = boardPositionX + Math.round(Math.abs(1 - this.boardScale) * 10) * xPerScale;
				shiftY = boardPositionY + Math.round(Math.abs(1 - this.boardScale) * 10) * yPerScale;
			}

			let maxVisibleX = Math.min((windowX - shiftX) / this.boardScale, this.boardWidth); // Maximum X position that is on the screen
			let maxVisibleY = Math.min((windowY - shiftY) / this.boardScale, this.boardHeight); // Maximum Y position that is on the screen

			let minVisibleX = 0; // Minimun X position that is on the sceen
			let minVisibleY = 0; // Minimum Y position that is on the screen

			if(this.boardScale > 1){
				for(let i = 1.1; i <= this.boardScale; i += 0.1){
					minVisibleX += Math.abs(1 - (i - 1)) * xPerScale;
					minVisibleY += Math.abs(1 - (i - 1)) * yPerScale;
				}
			}
			if(this.boardScale < 1){
				for(let i = 0.9; i >= this.boardScale; i -= 0.1){
					minVisibleX -= Math.abs(1 - (i - 1)) * xPerScale;
					minVisibleY -= Math.abs(1 - (i - 1)) * yPerScale;
				}
			}

			if(this.boardScale < 0.5 && boardPositionX < 0){
				minVisibleX = 0;
				maxVisibleX = this.boardWidth;
			}
			else {
				minVisibleX = Math.max(minVisibleX - boardPositionX / this.boardScale, 0);
			}
			if(this.boardScale < 0.5 && boardPositionY < 0){
				minVisibleY = 0;
				maxVisibleY = this.boardHeight; 
			}
			else {
				minVisibleY = Math.max(minVisibleY - boardPositionY / this.boardScale, 0);
			}

			let visibleWidth = maxVisibleX - minVisibleX; // Width of board that can be seen on the screen
			let visibleHeight = maxVisibleY - minVisibleY; // Height of board that can be seen on the sceen

			let pasteX = Math.min(Math.floor((minVisibleX + visibleWidth / 2) / 10) * 10, this.boardWidth - 80); // Where to put the component
			let pasteY = Math.min(Math.floor((minVisibleY + visibleHeight / 2) / 10) * 10, this.boardHeight - 80); // Where to put the component 

			return this.createComponent(this.copiedItem, pasteX, pasteY, options);
		}
	}

	connectPorts(portComponent1: PortComponent, portComponent2: PortComponent){
		let factory : ComponentFactory<ConnectionComponent> = this.resolver.resolveComponentFactory(ConnectionComponent);
		let c : ComponentRef<ConnectionComponent>  = this.connectionRef.createComponent(factory);
		
		let logicConn = portComponent1.LogicPort.parent.connectTo(portComponent2.LogicPort.parent, portComponent1.IsOutput, portComponent2.IsOutput);
		if(logicConn == null){
			c.destroy();
			return false;
		}
		c.instance.LogicConnection = logicConn;

		c.instance.destroyComponent = () => {
			c.destroy();
		}

		c.instance.portComponent1 = portComponent1;
		c.instance.portComponent2 = portComponent2;
		return true
	}

	public createComponent<T>(component: Type<T>, left = 100, top = 100, options: any) {
		if(component == null) 
			return;
		let factory  = this.resolver.resolveComponentFactory(component);
		let c : any = this.connectionRef.createComponent(factory);
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
