import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { Port } from 'src/models/Port';

@Component({
	selector: 'port',
	templateUrl: './port.component.html',
	styleUrls: ['./port.component.scss']
})
export class PortComponent implements OnInit {
	@Input() LogicParent : IDataOperator;
	@Input() IsOutput : boolean;
	public LogicPort : Port;
	@ViewChild('port') public port : ElementRef<HTMLDivElement>;
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

	public handleClick( event: MouseEvent ) : void {
		event.preventDefault();
		if(event.button != 0)
			return;
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
			this.line.style.stroke = "#DF9300";
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
	
	public handleMouseUp(event: MouseEvent){
		console.log("mouseup")
		if(this.placingService.isConnecting){
			console.log("is connecting")
			if(this !== this.placingService.connectingPort)
				if(this.placingService.connectPorts(this,this.placingService.connectingPort))
					this.placingService.componentChanged.emit();
		}
	}

	destroySelf = () => {}
}
