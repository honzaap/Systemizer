import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { Connection } from 'src/models/Connection';
import { Port } from 'src/models/Port';
import { ConnectionComponent } from '../connection/connection.component';

@Component({
	selector: 'port',
	templateUrl: './port.component.html',
	styleUrls: ['./port.component.scss'],
})
export class PortComponent implements OnInit {
	@Input() LogicParent : IDataOperator;
	@Input() IsOutput : boolean;
	public LogicPort : Port;
	@ViewChild('port') public port : ElementRef<HTMLDivElement>;
	@ViewChild('portImage') public portImage : ElementRef;
	connectionComponents: ConnectionComponent[] = [];
	board : HTMLElement;
	line : SVGPathElement;
	svgCanvas: HTMLElement;

	lineStartX = 0;
	lineStartY = 0;
	lineCurrX = 0;
	lineCurrY = 0;
	linePrevX = 0;
	linePrevY = 0;

	constructor(public placingService : PlacingService) {
	}
	ngOnInit(): void {
    	this.LogicPort = this.LogicParent.getPort(this.IsOutput);
		this.board = document.getElementById("board");
		this.svgCanvas = document.getElementById("svg-canvas");
  	}  

	removeConnection(connection: ConnectionComponent){
		let index = this.connectionComponents.findIndex(con => con === connection);
		if(index !== -1){
			this.connectionComponents.splice(index, 1);
		}
	}
	
	addConnection(connection: ConnectionComponent){
		let index = this.connectionComponents.findIndex(con => con === connection);
		if(index === -1){
			this.connectionComponents.push(connection);
		}
	}

	getConnectionComponent(logicConnection: Connection){
		return this.connectionComponents.find(
			connection => connection.LogicConnection === logicConnection
		);
	}

	autoAttach(){
		if(this.placingService.isConnecting){
			this.placingService.canMoveConnection = false;
			let line = this.svgCanvas.children[0];
			let style = line.getAttribute("d");
			style = style.split("L")[0] + `L${this.port.nativeElement.offsetLeft + this.port.nativeElement.clientWidth / 2} ${this.port.nativeElement.offsetTop + this.port.nativeElement.clientHeight / 2}`;
			line.setAttribute("d",style);
		}
	}

	detach(){
		this.placingService.canMoveConnection = true;
	}

	public getPortComponent(){
		return this;
	}

	public handleClick( event: Event ) : void {
		if(event instanceof MouseEvent){
			if(this.placingService.isConnecting)
				this.placingService.stopConnecting();
			else{
				this.placingService.startConnecting(this)
				this.line = document.createElementNS('http://www.w3.org/2000/svg','path');
				this.svgCanvas.appendChild(this.line);
				this.lineCurrX = event.clientX;
				this.lineCurrY = event.clientY;
				this.linePrevX = event.clientX;
				this.linePrevY = event.clientY;

				this.lineCurrX = this.port.nativeElement.offsetLeft + this.port.nativeElement.clientWidth/2;
				this.lineCurrY = this.port.nativeElement.offsetTop + this.port.nativeElement.clientHeight/2;
				this.lineStartX = this.port.nativeElement.offsetLeft + this.port.nativeElement.clientWidth/2;
				this.lineStartY = this.port.nativeElement.offsetTop + this.port.nativeElement.clientHeight/2;

				this.line.setAttribute('d',`M${this.lineStartX} ${this.lineStartY} L${this.lineCurrX} ${this.lineCurrY}`);
				this.line.style.stroke = "#6059DF";
				this.line.style.strokeWidth = "2";
				this.line.style.strokeLinecap = "round";
				this.line.style.strokeDasharray = "3";
				this.line.style.fill = "none";

				this.board.onmousemove = (event) => {
					if(this.placingService.canMoveConnection){
						if(!this.placingService.isConnecting) 
							this.placingService.startConnecting(this);
						this.lineCurrX = this.lineCurrX - (this.linePrevX - event.clientX) / this.placingService.boardScale;
						this.lineCurrY = this.lineCurrY - (this.linePrevY - event.clientY) / this.placingService.boardScale;
						this.line.setAttribute('d',`M${this.lineStartX} ${this.lineStartY} L${this.lineCurrX} ${this.lineCurrY}`);
						this.linePrevX = event.clientX;
						this.linePrevY = event.clientY;
					}
				}
			}
		}
		else if(event instanceof TouchEvent){
			if(this.placingService.isConnecting)
				this.placingService.stopConnecting();
			else{
				this.placingService.startConnecting(this)
				this.line = document.createElementNS('http://www.w3.org/2000/svg','path');
				this.svgCanvas.appendChild(this.line);
				this.lineCurrX = event.touches[0].clientX;
				this.lineCurrY = event.touches[0].clientY;
				this.linePrevX = event.touches[0].clientX;
				this.linePrevY = event.touches[0].clientY;

				this.lineCurrX = this.port.nativeElement.offsetLeft + this.port.nativeElement.clientWidth/2;
				this.lineCurrY = this.port.nativeElement.offsetTop + this.port.nativeElement.clientHeight/2;
				this.lineStartX = this.port.nativeElement.offsetLeft + this.port.nativeElement.clientWidth/2;
				this.lineStartY = this.port.nativeElement.offsetTop + this.port.nativeElement.clientHeight/2;

				this.line.setAttribute('d',`M${this.lineStartX} ${this.lineStartY} L${this.lineCurrX} ${this.lineCurrY}`);
				this.line.style.stroke = "#6059DF";
				this.line.style.strokeWidth = "2";
				this.line.style.strokeLinecap = "round";
				this.line.style.strokeDasharray = "3";
				this.line.style.fill = "none";
				this.board.ontouchmove = (event) => {
					if(this.placingService.canMoveConnection){
						if(!this.placingService.isConnecting) 
							this.placingService.startConnecting(this);
						this.lineCurrX = this.lineCurrX - (this.linePrevX - event.touches[0].clientX) / this.placingService.boardScale;
						this.lineCurrY = this.lineCurrY - (this.linePrevY - event.touches[0].clientY) / this.placingService.boardScale;
						this.line.setAttribute('d',`M${this.lineStartX} ${this.lineStartY} L${this.lineCurrX} ${this.lineCurrY}`);
						this.linePrevX = event.touches[0].clientX;
						this.linePrevY = event.touches[0].clientY;
					}
				}
				this.board.ontouchend = () =>{
					this.board.ontouchmove = null;
					this.board.ontouchend = null;
					this.svgCanvas.innerHTML = "";
					this.placingService.stopConnecting();
				}
			}
		}
	}
	
	public handleMouseUp(e){
		if(this.placingService.isConnecting){
			if(this !== this.placingService.connectingPort){
				if(this.IsOutput){
					if(this.placingService.connectPorts(this,this.placingService.connectingPort))
						this.placingService.componentChanged.emit();
				}
				else{
					if(this.placingService.connectPorts(this.placingService.connectingPort, this))
						this.placingService.componentChanged.emit();
				}
			}	
		}
	}

	ngAfterViewInit(){
		this.portImage.nativeElement.style.borderColor = this.LogicParent.color;
	}

	destroySelf = () => {}
}
