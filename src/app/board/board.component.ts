import { ViewContainerRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PlacingService } from '../placing.service';
import { SelectionService } from '../selection.service';

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

	constructor(private placingService : PlacingService, private selectionService: SelectionService) { }

	@ViewChild("conn", { read: ViewContainerRef }) conn;
	
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
				this.placingService.createComponent(this.placingService.creatingItem, e.offsetX - 20, e.offsetY - 20, this.placingService.creatingItemOptions);
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
		}

		window.addEventListener("keydown", (event)=>{
			if(event.key === 'Delete')
				this.selectionService.deleteSelection();
		})
		this.scaleControl.setValue(1);
	}

	copyItem(){
		if(this.selectionService.currentSelection != null)
			this.placingService.copyItem(this.selectionService.currentSelection.constructor, this.selectionService.currentSelection.getLogicComponent().options);
	}

	pasteItem(){
		this.placingService.pasteItem();
	}

	ngAfterViewInit(){
		this.placingService.connectionRef = this.conn;
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
		this.selectionService.deleteSelection();
	}
}