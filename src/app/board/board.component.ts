import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { download } from 'src/shared/ExtensionMethods';
import { ChangesService } from '../changes.service';
import { ExportPngOptions, ExportService, ExportSvgOptions } from '../export.service';
import { PlacingService } from '../placing.service';
import { SavingService } from '../saving.service';
import { SelectionService } from '../selection.service';
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


@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements AfterViewChecked  {

	board : HTMLElement;
	posX = 0;
	posY = 48;

	scaleControl: FormControl = new FormControl();
	scaleSelectList = [0.1, 0.5, 1, 1.5, 2];
	isLoading = false;
	isSaving = false;
	autosaving = false;
	saveFileName: string = "";
	systemName: string = "";

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

	/**
	 * Dictionary of keys witht assigned function when pressed with ctrl key
	 */
	controlShortcuts = { 
		"c": (e: Event) => {
			this.copyItem();
		},
		"v": (e: Event) => {
			this.pasteItem();
		},
		"x": (e: Event) => {
			this.cutItem();
		},
		"s": (e: Event) => {
			e.preventDefault();
			this.save(true);
		},
		"z": (e: Event) => {
			e.preventDefault();
			this.undo();
		},
		"y": (e: Event) => {
			e.preventDefault();
			this.redo();
		},
		"+": (e: Event) => {
			e.preventDefault();
			this.zoomIn();
		},
		"-": (e: Event) => {
			e.preventDefault();
			this.zoomOut();
		}
	}

	constructor(private placingService : PlacingService,
	private selectionService: SelectionService, 
	private snackBar: MatSnackBar,
	private savingService: SavingService,
	private changeRef: ChangeDetectorRef,
	private changesService: ChangesService,
	private exportService: ExportService) { 
		placingService.componentChanged.subscribe(()=>{
			// Some component just got changed, change will be added for undo
			this.componentChanged();
		})
		placingService.pushComponent.subscribe((component: OperatorComponent)=>{
			// A component was created somewhere else and needs to be added to the state of the board
			this.pushComponent(component);
		})
		setInterval(()=>{
			if(this.allLogicComponents.length != 0){
				this.save();
			}
		}, this.AUTOSAVE_INTERVAL * 1000);
	}

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	@Output() changeSystemName = new EventEmitter();

	allLogicComponents: IDataOperator[] = [];
	allComponents: OperatorComponent[] = [];

	/**
	 * The Json representation of the board before change was made
	 */
	beforeState: any = "";
	
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
		this.board.style.width = `${this.placingService.boardWidth}px`;
		this.board.style.height = `${this.placingService.boardHeight}px`;

		this.updateBoardTransform();

		this.board.addEventListener("mouseup",(e)=>{
			if(this.placingService.isCreating){
				let component = this.placingService.createComponent(this.placingService.creatingItem, e.offsetX - 20, e.offsetY - 20, this.placingService.creatingItemOptions);
				this.pushComponent(component);
				this.placingService.stopCreating();
				this.componentChanged();
			}
		})

		window.onkeydown = (e: KeyboardEvent)=>{
			if(e.ctrlKey && this.controlShortcuts[e.key]){
				this.controlShortcuts[e.key](e);
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
		let component = this.placingService.pasteItem(this.posX, this.posY);
		if(component != null){ // Add component to list
			this.pushComponent(component);
		}
	}

	cutItem(){
		this.copyItem();
		this.delete();
	}

	ngAfterViewChecked(): void { this.changeRef.detectChanges(); }
	ngAfterViewInit(){
		this.placingService.connectionRef = this.conn;
		this.placingService.snackBar = this.snackBar;
		this.loadLatestBoard();
	}

	async getBoardCanvas(options: ExportPngOptions){
		return await this.exportService.getCanvas(this.allLogicComponents, options);
	}

	async getBoardSvg(options: ExportSvgOptions){
		return await this.exportService.getSvg(this.allLogicComponents, options);
	}

	loadLatestBoard(){
		let latestBoardJson = localStorage.getItem(this.savingService.LOCALSTORAGE_AUTOSAVE_KEY);
		if(latestBoardJson){
			this.loadFromJson(latestBoardJson, false);
		}
		setTimeout(()=>{
			this.beforeState = this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName);
		}, 400);
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
		this.updateBoardTransform();
	}

	public handleMouseup = (e) : void => {
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

	public handleSelfClick(){
		this.selectionService.clearSelection();
		this.selectionService.clearConnectionSelection();
	}

	handleScaleChange(){
		this.placingService.boardScale = this.scaleControl.value;
		this.updateBoardTransform();
	}

	zoomOut(){
		this.placingService.boardScale = Math.max(this.placingService.boardScale - 0.1,0.1) ;
		this.updateBoardTransform();
	}

	zoomIn(){
		this.placingService.boardScale = Math.min(this.placingService.boardScale + 0.1,2);
		this.updateBoardTransform();
	}

	componentChanged(){
		this.changesService.pushChange(this.beforeState);
		this.beforeState = this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName);
	}

	undo(){
		let undoState = this.changesService.getUndo(this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName));
		if(undoState)
			this.loadFromJson(undoState, false);
		setTimeout(()=>{
			this.beforeState = this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName);
		}, 400)
	}

	redo(){
		let redoState = this.changesService.getRedo();
		if(redoState)
			this.loadFromJson(redoState, false);
		setTimeout(()=>{
			this.beforeState = this.savingService.getBoardJson(this.allLogicComponents, this.savingService.systemName);
		}, 400)
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

		if(this.selectionService.deleteSelection())
			this.componentChanged();
	}

	newFile(){
		this.changeSystemName.emit("Untitled system");
		this.systemName = "Untitled system";
		this.clearBoard(true);
		this.placingService.boardScale = 1;
		this.posX = 0;
		this.posY = 0;
		this.updateBoardTransform();
		this.changesService.reset();
	}

	save(showIcon = false){
		this.savingService.save(this.allLogicComponents);
		if(showIcon){
			this.autosaving = true;
			setTimeout(()=>{
				this.autosaving = false;
			}, 1000)
		}
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
		let file = this.savingService.getBoardJson(this.allLogicComponents, this.systemName);
		this.save();
		download(`${this.saveFileName}.json`, file);	
	}

	loadFromJson(json: string, showInfo = true){
		this.clearBoard();
		this.isLoading = true;
		let wasError = false;
		try{
			let file = JSON.parse(json);
			let components: any[];
			components = file;
			if(file.components)
				components = file.components;
			if(file.name)
				this.changeSystemName.emit(file.name);
			if(components.length == 0){
				throw Error("No components to load");
			}
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
				let component = this.placingService.createComponent(type as any, left, top, logicComponent.options);

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
		if(wasError && showInfo)
			this.placingService.showSnack("There were errors loading the file and some components couldn't be loaded.")
	}

	connectLoadedComponents(connectionTable: any[], outputPortsTable: any){
		for(let connection of connectionTable){
			connection.to.filter(con => con.isFromOutput == null || !con.isFromOutput).forEach(con => {
				this.placingService.connectPorts(connection.port, outputPortsTable[con.to]);
			});
		}
		setTimeout(()=>{
			this.isLoading = false;
			this.save();
		}, 100);
	}

	clearBoard(clearLocalStorage = false){
		for(let component of this.allComponents){
			this.selectionService.currentSelection = component;
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