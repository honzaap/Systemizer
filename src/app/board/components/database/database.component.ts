import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Database, DatabaseOptions } from 'src/models/Database';
import { DatabaseEndpoint } from 'src/models/Endpoint';
import { Port } from 'src/models/Port';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'database',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions"),
		outputPortRef: new ViewChild("outputPort")
	},
	templateUrl: './database.component.html',
	styleUrls: ['./database.component.scss']
})
export class DatabaseComponent extends OperatorComponent implements OnInit {

	public LogicDatabase : Database = new Database();
	SHARDS_PER_SHRARD = 3;

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver){
		super(placingService, selectionService, resolver);
	}

	ngAfterViewInit(): void {
		if(this.LogicDatabase.options.isMasterShard){
			this.LogicDatabase.outputPort = new Port(this.LogicDatabase,true,true);
		}
		super.Init(this.conn);
		this.LogicDatabase.onRemoveShard(()=>{
			this.outputPortRef.destroySelf()
			this.outputPortRef = null;
		})
	}

	ngOnInit(){}

	getActionsElement(){
		return this.actionsRef;
	}

	public getLogicComponent(){
		return this.LogicDatabase;
	}

	changeDatabaseType(){
		if(this.LogicDatabase.outputPort == null)	
			return;
		for(let conn of this.LogicDatabase.outputPort.connections){
			let options = conn.getOtherPort(this.LogicDatabase.outputPort).parent.options;
			if(options instanceof  DatabaseOptions)
				(options as DatabaseOptions).type = this.LogicDatabase.options.type;
		}
	}

	createOutputPort(){
		this.LogicDatabase.outputPort = new Port(this.LogicDatabase,true,true);
		this.createPort(true);
	}

	shard(){
		this.LogicDatabase.options.isMasterShard = true;
		this.createOutputPort();

		let dirX = 0;
		let dirY = 0;
		let initX = this.LogicDatabase.options.X;
		let initY = this.LogicDatabase.options.Y;
		if(this.LogicDatabase.options.X <= 1920){ // Positioning shards
			dirY = this.LogicDatabase.options.Y <= 960 - this.SHARDS_PER_SHRARD * 80 ? 1 : -1;
			initY = dirY > 0 ? Math.min(Math.max(this.LogicDatabase.options.Y-70,0), 960) : Math.min(Math.max(this.LogicDatabase.options.Y,0), 960);
			initX += 120;
		}
		else if(this.LogicDatabase.options.X <= 1960 - this.SHARDS_PER_SHRARD * 80 && this.LogicDatabase.options.Y >= 60){
			dirX = 1;
			initY = this.LogicDatabase.options.Y-40;
		}
		else{
			dirX = -1;
			initY = this.LogicDatabase.options.Y + (this.LogicDatabase.options.Y <= 960-70 ? 70 : -70);
		}
		let ep = new DatabaseEndpoint("/shard");
		for(let i = 0; i < this.SHARDS_PER_SHRARD; i++){
			let comp = this.placingService.createComponent(DatabaseComponent, initX + dirX * 80 * i, initY + dirY * 70 * i, { type: this.LogicDatabase.options.type, isShard: true, title: `Shard ${i+1}`, endpoints: [ep] });
			comp.onViewInit.push(() => {
				this.placingService.connectPorts(this.getPortComponent(true), comp.getPortComponent(false));
				this.placingService.pushComponent.emit(comp);
			});
			comp.onAfterDestroySelf = () => {
				if(this.LogicDatabase.outputPort.connections.length == 0)
					this.LogicDatabase.options.isMasterShard = false;
			}
		}
		setTimeout(()=>{
			this.afterChange();
		}, 300);
	}

	static getColor(): string{
		let c = new Database();
		return c.color;
	}
}
