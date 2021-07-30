import { EventEmitter, Injectable, Output } from '@angular/core';
import { LineBreak } from 'src/models/Connection';
import { EventDispatcher, Handler } from 'src/models/Shared/EventDispatcher';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { OperatorComponent } from './board/components/Shared/OperatorComponent';

class StopSelectingEvent {
	top: number;
	left: number;
	width: number;
	height: number;
}

interface ChangeSelectionEvent {}

@Injectable({
  	providedIn: 'root'
})
export class SelectionService {
	@Output() onStopSelecting = new EventEmitter<StopSelectingEvent>();

	prevX: number;
	prevY: number;

	currentConnectionSelection: ConnectionComponent;
	currentLineBreakSelection: LineBreak;
	currentLineBreakList: LineBreak[];
	currentConnectionSelections: ConnectionComponent[] = [];
	currentSelections: OperatorComponent[] = [];

	selectionRect: HTMLDivElement;

	selectionStartX: number;
	selectionStartY: number;

	selectionClientX: number;
	selectionClientY: number;

	selectionPrevX: number;
	selectionPrevY: number;

	selectionWidth = 0;
	selectionHeight = 0;

	selectionScale: number = 1;

	addSelection(selection: OperatorComponent, multiple: boolean = false){
		if(this.currentSelections.indexOf(selection) == -1){ // Add to current selections
			if(multiple){ // Add to current multiple selections
				selection.anchorRef.nativeElement.classList.add("is-current-selection")
				this.currentSelections.push(selection);
				// Look if the component is connected to already selected component
				let selectionOutputPort = selection.getLogicComponent().getPort(true);
				let selectionInputPort = selection.getLogicComponent().getPort(false);
				for(let component of this.currentSelections){
					let logicComponent = component.getLogicComponent();
					let outputPort = logicComponent.getPort(true);
					let inputPort = logicComponent.getPort(false);
					if(outputPort){
						if(selectionInputPort){
							let logicConnection = outputPort.connections.find(connection =>
								connection.getOtherPort(outputPort) === selectionInputPort	
							)
							if(logicConnection != null){
								let comp = selection.getPortComponent(false).getConnectionComponent(logicConnection);
								if(comp)
									this.currentConnectionSelections.push(comp);
								else{
									setTimeout(()=>{
										comp = selection.getPortComponent(false).getConnectionComponent(logicConnection);
										if(comp)
											this.currentConnectionSelections.push(comp);
									}, 50);
								}
							}
						}
					}
					if(inputPort){
						if(selectionOutputPort){
							let logicConnection = inputPort.connections.find(connection =>
								connection.getOtherPort(inputPort) === selectionOutputPort	
							)
							if(logicConnection != null){
								let comp = selection.getPortComponent(true).getConnectionComponent(logicConnection);
								if(comp)
									this.currentConnectionSelections.push(comp);
								else{
									setTimeout(()=>{
										comp = selection.getPortComponent(true).getConnectionComponent(logicConnection);
										if(comp)
											this.currentConnectionSelections.push(comp);
									}, 50);
								}
							}
						}
					}
				}
				
			}
			else{ // Set as currently selected
				for(let oldSelection of this.currentSelections){
					oldSelection.anchorRef.nativeElement.classList.remove("is-current-selection")
				}
				selection.anchorRef.nativeElement.classList.add("is-current-selection")
				this.currentSelections = [selection];
				this.clearCurrentConnectionSelections();
			}
		}
		this.clearConnectionSelection();
		this.clearLineBreakSelection();
		
		this.fireChangeSelection({});
	}

	clearSelection(){
		for(let selection of this.currentSelections){
			selection.anchorRef.nativeElement.classList.remove("is-current-selection")
		}  
		this.currentSelections = [];
		this.fireChangeSelection({});
	}

	// Connection
	setConnectionSelection(selection: ConnectionComponent){
		if(selection != this.currentConnectionSelection){
			if(this.currentConnectionSelection != null){
				this.currentConnectionSelection.mainPath.nativeElement.classList.remove("is-current-selection")
			}
			selection.mainPath.nativeElement.classList.add("is-current-selection")
			this.currentConnectionSelection = selection;
			this.clearSelection();
			this.clearLineBreakSelection();
			this.clearCurrentConnectionSelections();
			this.fireChangeSelection({});
		}
	}

	clearConnectionSelection(){
		if(this.currentConnectionSelection != null){
			this.currentConnectionSelection.mainPath.nativeElement.classList.remove("is-current-selection")
			this.currentConnectionSelection = null;
			this.fireChangeSelection({});
		}  
	}

	// LineBreak
	setLineBreakSelection(selection: LineBreak, list: LineBreak[]){
		if(selection != this.currentLineBreakSelection){
			this.currentLineBreakSelection = selection;
			this.currentLineBreakList = list;
			this.clearSelection();
			this.clearConnectionSelection();
			this.fireChangeSelection({});
		}
	}

	clearLineBreakSelection(){
		if(this.currentLineBreakSelection != null){
			this.currentLineBreakList = [];
			this.currentLineBreakSelection = null;
			this.fireChangeSelection({});
		}  
	}

	clearCurrentConnectionSelections(){
		this.currentConnectionSelections = [];
	}

	/**
	 * Returns true if something was deleted, false otherwise
	 */
	deleteSelection(): boolean{
		if(this.currentConnectionSelection == null && this.currentSelections.length == 0 && this.currentLineBreakSelection == null)
			return false;
		if(this.currentConnectionSelection){
			this.currentConnectionSelection.destroySelf();
			return true;
		}
		else if(this.currentLineBreakSelection){
			let index = this.currentLineBreakList.findIndex(b => b.x === this.currentLineBreakSelection.x && b.y === this.currentLineBreakSelection.y);
			if(index === -1)
				return false;
			this.currentLineBreakList.splice(index, 1);
			return true;
		}
		for(let selection of this.currentSelections){
			selection.destroySelf();    
		}
		this.clearSelection();
		this.clearLineBreakSelection();
		this.clearCurrentConnectionSelections();
		this.clearConnectionSelection();
		return true;
	}

	startSelecting(e: MouseEvent, scale: number){
		this.clearConnectionSelection();
		this.clearLineBreakSelection();
		this.clearCurrentConnectionSelections();
		this.clearSelection();
		let board = document.getElementById("board");
		let rect = document.createElement("div");
		rect.style.left = `${e.clientX}px`;
		rect.style.top = `${e.clientY}px`;
		rect.style.width = "0px";
		rect.style.height = "0px";
		rect.className = "selection-rect"
		rect.style.display = "none";
		board.appendChild(rect);

		this.selectionRect = rect;
		this.selectionStartX = e.offsetX;
		this.selectionStartY = e.offsetY;

		this.selectionClientX = e.clientX;
		this.selectionClientY = e.clientY;

		this.selectionPrevX = e.clientX;
		this.selectionPrevY = e.clientY;

		this.selectionWidth = 0;
		this.selectionHeight = 0;

		this.selectionScale = scale;

		window.addEventListener("mousemove", this.moveSelectionRect);
		window.addEventListener("mouseup", this.stopSelecting);
	}

	stopSelecting = () => {
		this.onStopSelecting.emit({ 
			top: parseInt(this.selectionRect.style.top), 
			left: parseInt(this.selectionRect.style.left),
			width: Math.abs(this.selectionWidth),
			height: Math.abs(this.selectionHeight)
		});
		window.removeEventListener("mousemove", this.moveSelectionRect);
		window.removeEventListener("mouseup", this.stopSelecting);
		document.getElementById("board").removeChild(this.selectionRect);
		this.selectionRect = null;
	}

	moveSelectionRect = (e: MouseEvent) =>{
		this.selectionRect.style.display = "block";
		let diffX = (this.selectionPrevX - e.clientX) / this.selectionScale;
		let diffY = (this.selectionPrevY - e.clientY) / this.selectionScale;

		this.selectionWidth -= diffX;
		this.selectionHeight -= diffY;


		this.selectionRect.style.width = Math.abs(this.selectionWidth).toString() + "px";
		this.selectionRect.style.left = e.clientX < this.selectionClientX ? (this.selectionStartX + this.selectionWidth).toString() + "px" : this.selectionStartX.toString() + "px";

		this.selectionRect.style.height = Math.abs(this.selectionHeight).toString() + "px";
		this.selectionRect.style.top = e.clientY < this.selectionClientY ? (this.selectionStartY + this.selectionHeight).toString() + "px" : this.selectionStartY.toString() + "px";

		this.selectionPrevX = e.clientX;
		this.selectionPrevY = e.clientY;
	}

	public moveComponents = (event: MouseEvent, scale: number): void => {
		for(let selection of this.currentSelections){
			selection.setPosition(
				selection.getLogicComponent().options.X - (this.prevX - event.clientX) / scale, 
				selection.getLogicComponent().options.Y - (this.prevY - event.clientY) / scale
			);
			
		}
		for(let connection of this.currentConnectionSelections){
			if(connection.LogicConnection.lineBreaks.length > 2){
				connection.LogicConnection.lineBreaks.filter((c ,i) => {
					return i!==0 && i < connection.LogicConnection.lineBreaks.length-1;
				}).forEach(br => {
					let lineBreak = this.convertLineBreak(
						{x: br.x - (this.prevX - event.clientX) / scale,
						y: br.y - (this.prevY - event.clientY) / scale})
					br.x = lineBreak.x;
					br.y = lineBreak.y;
				})
			}
		}
		this.prevX = this.convertScaledPosition(event.clientX, scale);
		this.prevY = this.convertScaledPosition(event.clientY, scale);
	}

	moveSelectedConnections(event: MouseEvent, boardScale: number) {
		
	}

	private convertLineBreak(lineBreak: LineBreak){
		return {x: Math.round(lineBreak.x / 10) * 10, y: Math.round(lineBreak.y / 10) * 10};
	}

	private convertScaledPosition(number, scale: number){
		return Math.round(number / (10 * scale)) * (10 * scale);
	}

	constructor() { }

	private changeSelectionDispatcher = new EventDispatcher<ChangeSelectionEvent>();
	public onChangeSelection(handler: Handler<ChangeSelectionEvent>) {
		this.changeSelectionDispatcher.register(handler);
	}
	private fireChangeSelection(event: ChangeSelectionEvent) { 
		this.changeSelectionDispatcher.fire(event);
	}
}