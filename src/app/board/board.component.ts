import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { sleep, UUID } from 'src/shared/ExtensionMethods';
import { ChangesService } from '../changes.service';
import { ExportPngOptions, ExportService, ExportSvgOptions } from '../export.service';
import { PlacingService } from '../placing.service';
import { SavingService } from '../saving.service';
import { SelectionService } from '../selection.service';
import { ViewingService } from '../viewing.service';
import { ApiComponent } from './components/api/api.component';
import { ApiGatewayComponent } from './components/apigateway/apigateway.component';
import { CacheComponent } from './components/cache/cache.component';
import { ClientComponent } from './components/client/client.component';
import { ClientclusterComponent } from './components/clientcluster/clientcluster.component';
import { CloudStorageComponent } from './components/cloudstorage/cloudstorage.component';
import { DatabaseComponent } from './components/database/database.component';
import { LoadbalancerComponent } from './components/loadbalancer/loadbalancer.component';
import { MessagequeueComponent } from './components/messagequeue/messagequeue.component';
import { ProxyComponent } from './components/proxy/proxy.component';
import { PubsubComponent } from './components/pubsub/pubsub.component';
import { OperatorComponent } from './components/Shared/OperatorComponent';
import { TextfieldComponent } from './components/textfield/textfield.component';
import { WebserverComponent } from './components/webserver/webserver.component';

class SavedBoard{
	title: string;
	board: IDataOperator[];
	save: any;

	constructor(title: string, board: IDataOperator[], save: any) {
		this.title = title;
		this.board = board;
		this.save = save;
	}
}

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements AfterViewChecked  {

	board : HTMLElement;
	posX = 0;
	posY = 0;

	isLoading = false;
	autosaving = false;
	currentBoardId: string = UUID();
	isAllClientsSendingData = false;
	canToggleClientsSendingData = true;

	@Input() isReadOnly = false;
	@Input() loadedSave: any;

	AUTOSAVE_INTERVAL = 30;
	/**
	 * Converting types of logic component to angular component
	 */
	componentTypes = { 
		Client: ClientComponent,
		ClientCluster: ClientclusterComponent,
		API: ApiComponent,
		APIGateway: ApiGatewayComponent,
		Cache: CacheComponent,
		CloudStorage: CloudStorageComponent,
		Database: DatabaseComponent,
		LoadBalancer: LoadbalancerComponent,
		MessageQueue: MessagequeueComponent,
		PubSub: PubsubComponent,
		Proxy: ProxyComponent,
		TextField: TextfieldComponent,
		WebServer: WebserverComponent
	}

	@ViewChild("conn", { read: ViewContainerRef }) conn;
	@ViewChild("savedBoardsRef") savedBoardsRef: ElementRef;

	@Output() changeSystemName = new EventEmitter();

	allLogicComponents: IDataOperator[] = [];
	allComponents: OperatorComponent[] = [];

	/**
	 * The Json representation of the board before change was made
	 */
	beforeState: any = "";

	showSavedBoards: boolean;
	showSavedBoardsPopup: boolean;
	savedBoards: SavedBoard[] = [];
	selectedSavedBoard: SavedBoard;

	constructor(private placingService : PlacingService,
	private selectionService: SelectionService, 
	private snackBar: MatSnackBar,
	private savingService: SavingService,
	private changeRef: ChangeDetectorRef,
	private changesService: ChangesService,
	private exportService: ExportService,
	private viewingService: ViewingService,
	private renderer: Renderer2) { }
	
	scroll(event){
		if(event.deltaY < 0)
			this.zoomIn();
		else
			this.zoomOut();
	}

	ngOnInit(): void {
		this.board = document.getElementById("board");
		this.board.style.width = `${this.placingService.boardWidth}px`;
		this.board.style.height = `${this.placingService.boardHeight}px`;

		this.updateBoardTransform();

		window.addEventListener("resize", event => {
			event.preventDefault();
		});

		if(!this.isReadOnly){ // These events will not be used in readonly board
			this.selectionService.onStopSelecting.subscribe((e) => {
				for(let component of this.allComponents){
					let logicComponent = component.getLogicComponent();
					let size = this.exportService.getComponentSize(logicComponent);
					let pos = {top: logicComponent.options.Y, left: logicComponent.options.X};
					if(pos.top >= e.top && pos.left >= e.left && pos.left + size.width < e.left + e.width && pos.top + size.height < e.top + e.height){
						setTimeout(()=>{
							this.selectionService.addSelection(component, true);
						}, 20);
					}
				}
			})
			this.board.addEventListener("mouseup",(e)=>{
				if(this.placingService.isCreating){
					let component = this.placingService.createComponent(this.placingService.creatingItem, e.offsetX - 20, e.offsetY - 20, this.placingService.creatingItemOptions);
					this.pushComponent(component);
					this.placingService.stopCreating();
					this.componentChanged();
				}
			})
			this.placingService.componentChanged.subscribe(()=>{
				// Some component just got changed, change will be added for undo
				this.componentChanged();
			})
			this.placingService.pushComponent.subscribe((component: OperatorComponent)=>{
				// A component was created somewhere else and needs to be added to the state of the board
				this.pushComponent(component);
			})
			setInterval(()=>{
				if(this.allLogicComponents.length != 0){
					this.save();
				}
			}, this.AUTOSAVE_INTERVAL * 1000);
		}
	}

	copyItem(){
		if(this.selectionService.currentSelections.length == 0)
			return;
		let selections = [];
		for(let selection of this.selectionService.currentSelections){
			selections.push({component: selection.constructor, options: selection.getLogicComponent().options})
		}
		this.placingService.copyItems(selections);
	}

	pasteItem(){
		this.selectionService.clearSelection();
		for(let component of this.placingService.pasteItem()){
			this.pushComponent(component);
			component.onViewInit = ()=>{
				this.selectionService.addSelection(component, true);
			}
		}
		this.placingService.startPlacing()
		this.componentChanged();
	}

	cutItem(){
		this.copyItem();
		this.delete();
	}

	ngAfterViewChecked(): void { this.changeRef.detectChanges(); }
	async ngAfterViewInit(){
		this.placingService.connectionRef = this.conn;
		this.placingService.snackBar = this.snackBar;
		
		if(this.loadedSave){
			this.loadFromSave(this.loadedSave);
		}
		else if(!this.isReadOnly){
			this.loadLatestBoard();
		}
		
		if(!this.isReadOnly){
			// Loading saved boards
			let savedBoardsJson = this.savingService.getSavedBoardsJson();
			if(savedBoardsJson == null)
				return;
			let savedBoards = JSON.parse(savedBoardsJson) as any[];
			if(savedBoards.length == 0)
				return;
			for(let board of savedBoards){ // Convert all boards to IDataOperator[]
				let convertedBoard = this.savingService.getComponentsFromSave(board.components);
				if(convertedBoard)
					this.savedBoards.push(new SavedBoard(board.name || "Untitled System", convertedBoard, board));
			}
			for(let savedBoard of this.savedBoards){
				this.displaySavedBoard(savedBoard);
			}
			this.showSavedBoardsPopup = true;
			setTimeout(()=>{
				this.showSavedBoardsPopup = false;
			}, 6500);
		}
		else{
			this.resetView();
			this.viewingService.setTitlesHidden(false, false);
		}
	}

	async displaySavedBoard(savedBoard: SavedBoard){
		let divContainer = this.renderer.createElement('div');
		divContainer.className = "saved-board";
		divContainer.id = savedBoard.save.id;

		divContainer.onclick = () => {
			// Display options
			if(this.selectedSavedBoard){
				document.getElementById(this.selectedSavedBoard.save.id).classList.remove("selected")
			}
			this.selectedSavedBoard = savedBoard;
			document.getElementById(this.selectedSavedBoard.save.id).classList.add("selected")
		}
		divContainer.ondblclick  = () => {
			// Load board
			this.closeSavedBoards();
			this.loadFromSave(savedBoard.save);
		}
		let canvas = await this.getBoardCanvas(savedBoard.board);
		canvas.style.width = "100%";
		canvas.style.marginBottom = "-5px";

		let title = this.renderer.createElement("span");
		title.innerText = savedBoard.title;
		title.className = "saved-board-title";

		let existing = document.getElementById(savedBoard.save.id);
		if(existing)
			this.savedBoardsRef.nativeElement.removeChild(existing);

		this.renderer.appendChild(divContainer, canvas);
		this.renderer.appendChild(divContainer, title);
		this.renderer.appendChild(this.savedBoardsRef.nativeElement, divContainer);
	}

	openSavedBoards(){
		this.showSavedBoards = true;
		this.showSavedBoardsPopup = false;
		let savedBoard = this.savedBoards.find(board => board.save.id == this.currentBoardId);
		if(savedBoard)
			this.displaySavedBoard(savedBoard);
	}

	closeSavedBoards(){
		this.showSavedBoards = false;
	}

	deleteSelectedSavedBoard(){
		this.savedBoardsRef.nativeElement.removeChild(document.getElementById(this.selectedSavedBoard.save.id));

		this.savedBoards.splice(this.savedBoards.findIndex(board => board === this.selectedSavedBoard), 1);
		this.selectedSavedBoard = null;
		this.savingService.saveBoards(this.savedBoards.map(board => board.save));
	}

	loadSelectedSavedBoard(){
		if(this.allLogicComponents.length != 0)
			this.saveCurrentBoardToAllBoards();
		this.closeSavedBoards();
		this.loadFromSave(this.selectedSavedBoard.save);
	}

	async getBoardCanvas(board: IDataOperator[]){
		return await this.exportService.getCanvas(board, new ExportPngOptions());
	}

	async getCurrentBoardCanvas(options: ExportPngOptions){
		return await this.exportService.getCanvas(this.allLogicComponents, options);
	}

	async getCurrentBoardSvg(options: ExportSvgOptions){
		return await this.exportService.getSvg(this.allLogicComponents, options);
	}

	loadLatestBoard(){
		let latestBoardJson = this.savingService.getLatestBoardJson();
		if(latestBoardJson){
			try{
				this.loadFromJson(latestBoardJson, false);
			}
			catch(e){
				console.log(e);
				this.isLoading = false;
			}
		}
		setTimeout(()=>{
			this.beforeState = this.getCurrentBoardJson();
		}, 1000);
	}

	public handleMousedown(event: Event) {
		let e = event as MouseEvent;
		if(e.button == 0 && !this.isReadOnly){
			// Start selecting
			this.selectionService.startSelecting(e, this.placingService.boardScale)
		}
		else if(this.isReadOnly || e.button == 1 || e.button == 2){
			e.preventDefault();
			if(!this.placingService.canDrag()) 
				return;
			this.board.classList.add("moving")
			this.board.addEventListener( "mousemove", this.handleMousemove );
			window.addEventListener( "mouseup", this.handleMouseup );
		}
	}

	public handleMousemove = ( event: MouseEvent ): void => {
		this.posX += event.movementX;
		this.posY += event.movementY;

		this.updateBoardTransform();
	}

	public handleMouseup = (e) : void => {
		this.board.classList.remove("moving")
		this.board.removeEventListener( "mousemove", this.handleMousemove );
		window.removeEventListener( "mouseup", this.handleMouseup );
	}

	public updateBoardTransform(){
		this.board.style.transform = `translateX(${this.posX}px) translateY(${this.posY}px) scale(${this.placingService.boardScale})`;
	}

	public handleClick = (event: MouseEvent) : void => {
		if(this.placingService.isConnecting){
			this.placingService.stopConnecting();
			this.board.onmousemove = null;
			document.getElementsByClassName("svg-canvas")[0].innerHTML = "";
		}
	}

	public handleSelfClick(event: Event){
		this.selectionService.clearSelection();
		this.selectionService.clearConnectionSelection();
	}

	zoomOut(){
		this.placingService.boardScale = Math.max(this.placingService.boardScale - 0.1,0.1) ;
		this.updateBoardTransform();
	}

	zoomIn(){
		this.placingService.boardScale = Math.min(this.placingService.boardScale + 0.1,2);
		this.updateBoardTransform();
	}

	toggleTitles(){
		this.viewingService.setTitlesHidden(
			!this.viewingService.isTitlesHidden(), false
		);
	}

	resetView(){
		if(this.allLogicComponents.length == 0 || !this.isReadOnly){
			this.posX = (window.innerWidth - this.placingService.boardWidth) / 2;
			this.posY = (window.innerHeight - this.placingService.boardHeight) / 2;
			this.placingService.boardScale = 1;
		}
		else{
			let minX = Number.MAX_VALUE;
			let minY = Number.MAX_VALUE;
			let maxX = 0;
			let maxY = 0;

			for(let component of this.allLogicComponents){
				minX = Math.min(component.options.X, minX);
				minY = Math.min(component.options.Y, minY);
				maxX = Math.max(component.options.X, maxX);
				maxY = Math.max(component.options.Y, maxY);
			}
			
			let width = maxX - minX + 150;
			let height = maxY - minY + 90;

			this.placingService.boardScale = Math.max(Math.min(Math.round((window.innerWidth / width) / 0.1) * 0.1, 2), 0.3);
			this.placingService.boardScale = Math.max(Math.min(Math.round((window.innerHeight / height) / 0.1) * 0.1, this.placingService.boardScale), 0.3);

			let xFromCenter = (this.placingService.boardWidth / 2) - minX;
			let yFromCenter = (this.placingService.boardHeight / 2) - minY;

			this.posX = - minX + xFromCenter + 90;
			this.posY = - minY + yFromCenter + 15;


			for(let i = 2; i > this.placingService.boardScale; i -= 0.1){
				this.posX -= xFromCenter / 10;
				this.posY -= yFromCenter / 10;
			}
		}
		this.updateBoardTransform();
	}

	/**
	 * Triggers every client in the board to send data automatically
	 */
	async startAllClients(){
		if(this.isAllClientsSendingData || !this.canToggleClientsSendingData)
			return;
		this.canToggleClientsSendingData = false;
		this.isAllClientsSendingData = true;
		for(let component of this.allComponents){
			if(component instanceof ClientComponent){
				if(component.canEstabilishConnection){
					component.estabilishConnection();
				}
				component.toggleAutomaticSend();
				await sleep(300); // Make some delay between
			}
			else if(component instanceof ClientclusterComponent){
				component.LogicClientCluster.startSendingData();
				await sleep(300); // Make some delay between
			}
		}
		setTimeout(()=>{
			this.canToggleClientsSendingData = true;
		}, 400);
	}

	stopAllClients(){
		if(!this.isAllClientsSendingData || !this.canToggleClientsSendingData)
			return;
		this.canToggleClientsSendingData = false;
		this.isAllClientsSendingData = false;
		for(let component of this.allComponents){
			if(component instanceof ClientComponent){
				if(component.canEndConnection){
					component.endConnection();
				}
				else{
					component.toggleAutomaticSend();
				}
			}
			else if(component instanceof ClientclusterComponent){
				component.LogicClientCluster.stopSendingData();
			}
		}
		setTimeout(()=>{
			this.canToggleClientsSendingData = true;
		}, 400);
	}

	componentChanged(){
		this.changesService.pushChange(this.beforeState);
		this.beforeState = this.getCurrentBoardJson();
	}

	getCurrentBoardJson(){
		return this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName, this.currentBoardId);
	}

	undo(){
		let undoState = this.changesService.getUndo(this.getCurrentBoardJson());
		if(undoState)
			this.loadFromJson(undoState, false);
		setTimeout(()=>{
			this.beforeState = this.getCurrentBoardJson();
		}, 400)
	}

	redo(){
		let redoState = this.changesService.getRedo();
		if(redoState)
			this.loadFromJson(redoState, false);
		setTimeout(()=>{
			this.beforeState = this.getCurrentBoardJson();
		}, 400)
	}

	delete(){
		let components = this.selectionService.currentSelections; 
		for(let component of components){ 
			let logicComponent = component.getLogicComponent();
			this.allComponents.splice(this.allComponents.findIndex(comp => comp === component),1);
			this.allLogicComponents.splice(this.allLogicComponents.findIndex(comp => comp.originID == logicComponent.originID),1);
		}

		if(this.selectionService.deleteSelection())
			this.componentChanged();
	}

	newFile(){
		if(this.allLogicComponents.length != 0)
			this.saveCurrentBoardToAllBoards();
		this.currentBoardId = UUID();
		this.changeSystemName.emit("Untitled system");
		this.clearBoard(true);
		this.resetView();
		this.changesService.reset();
	}

	save(showIcon = false){
		if(this.isReadOnly)
			return;
		this.savingService.save(this.allLogicComponents, this.currentBoardId);
		this.saveCurrentBoardToAllBoards();
		if(showIcon){
			this.autosaving = true;
			setTimeout(()=>{
				this.autosaving = false;
			}, 1000)
		}
	}

	loadFromJson(json: string, showInfo = true){
		try{
			let file = JSON.parse(json);
			this.loadFromSave(file);
		}
		catch(e){
			console.log(e);
			if(showInfo)
				this.placingService.showSnack("This file could not be loaded because it is corrupted or not supported.")
			setTimeout(()=>{
				this.isLoading = false;
			}, 100);
			return;
		}
	}

	/**
	 * Loads the board from save object generated by saving service
	 */
	loadFromSave(save: any, showInfo = true){
		this.clearBoard();
		this.isLoading = true;
		let wasError = false;
		let components: any[];
		components = save;
		if(save.components)
			components = save.components;
		if(components == null || components.length == 0){
			this.isLoading = false;
			return;
		}
		if(save.name)
			this.changeSystemName.emit(save.name);
		if(save.id != null && save.id != "undefined")
			this.currentBoardId = save.id;
		else
			this.currentBoardId = UUID();

		let connectionTable: any[] = [];
		let outputPortsTable: any = {};
		let index = 0;
		for(let logicComponent of components){
			let type = this.getComponentTypeFromName(logicComponent.type);
			if(type == null || logicComponent.options == null){
				wasError = true;
				if(index == components.length - 1){
					this.connectLoadedComponents(connectionTable, outputPortsTable);
				}
				index++;
				continue;
			}
			let left = logicComponent.options.X;
			let top = logicComponent.options.Y;
			let component = this.placingService.createComponent(type as any, left, top, logicComponent.options, this.isReadOnly);

			this.pushComponent(component);
			const currentComponentIndex = index;
			component.onViewInit = () => {
				if(component instanceof DatabaseComponent && component.getLogicComponent().options.isMasterShard){
					component.createOutputPort()
				}
				let outputPort = component.getPortComponent(true);
				let inputPort = component.getPortComponent(false);
				if(outputPort){
					outputPortsTable[logicComponent.id] = outputPort;
				}
				if(inputPort){
					let connection: any = {};
					connection.port = inputPort;
					connection.id = logicComponent.id;
					connection.to = logicComponent.connections;
					connectionTable.push(connection);
				}
				if(currentComponentIndex == components.length - 1){
					setTimeout(()=>{
						this.connectLoadedComponents(connectionTable, outputPortsTable);
					}, 150);
				}
			}
			index++;
		}
		if(wasError && showInfo)
			this.placingService.showSnack("There were errors loading the file and some components couldn't be loaded.")
	}

	saveCurrentBoardToAllBoards(){
		let boardSave = this.savingService.getBoardSave(this.allLogicComponents, this.savingService.systemName, this.currentBoardId);
		let currentBoardIndex = this.savedBoards.findIndex(board => board.save.id == this.currentBoardId);
		let savedBoard = new SavedBoard(boardSave.name, this.allLogicComponents, boardSave);
		if(currentBoardIndex != -1)
			this.savedBoards.splice(currentBoardIndex, 1);
		else
			this.displaySavedBoard(savedBoard);
		this.savedBoards.push(savedBoard);
		this.savingService.saveBoards(this.savedBoards.map(board => board.save));
	}

	connectLoadedComponents(connectionTable: any[], outputPortsTable: any){
		for(let connection of connectionTable){
			connection.to.filter(con => con.isFromOutput == null || !con.isFromOutput).forEach(con => {
				this.placingService.connectPorts(connection.port, outputPortsTable[con.to], this.isReadOnly);
			});
		}
		setTimeout(()=>{
			this.isLoading = false;
			this.save();
			this.updateComponents();
		}, 100);
	}

	updateComponents(){
		for(let component of this.allComponents){
			if((component as any).updateSelection){
				(component as any).updateSelection();
			}
		}
	}

	clearBoard(clearLocalStorage = false){
		for(let component of this.allComponents){
			this.selectionService.currentSelections = [component]; 
			try{ // Deleting element while sending data could throw error
				this.selectionService.deleteSelection();
			}
			catch{}
		}
		if(clearLocalStorage)
			localStorage.setItem(this.savingService.LOCALSTORAGE_AUTOSAVE_KEY,"");
		this.allComponents = [];
		this.allLogicComponents = [];
	}

	getComponentTypeFromName(name: string){
		return this.componentTypes[name];
	}

	pushComponent(component: OperatorComponent){
		this.allComponents.push(component);
		this.allLogicComponents.push(component.getLogicComponent());
	}
}