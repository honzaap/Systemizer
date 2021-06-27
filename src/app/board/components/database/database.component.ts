import { ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Database, DatabaseOptions } from 'src/models/Database';
import { OperatorComponent } from '../Shared/OperatorComponent';
import { DatabaseEndpoint } from 'src/models/Endpoint';
import { Port } from 'src/models/Port';
import { ChangesService } from 'src/app/changes.service';

@Component({
	selector: 'database',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions"),
	},
	templateUrl: './database.component.html',
	styleUrls: ['./database.component.scss']
})
export class DatabaseComponent extends OperatorComponent implements OnInit {

	public LogicDatabase : Database = new Database();
	SHARDS_PER_SHRARD = 3;

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, changesService: ChangesService){
		super(placingService, selectionService, resolver, changesService);
	}

	ngAfterViewInit(): void {
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
		for(let conn of this.LogicDatabase.outputPort.connections){
			let options = conn.getOtherPort(this.LogicDatabase.outputPort).parent.options;
			if(options instanceof  DatabaseOptions)
				(options as DatabaseOptions).type = this.LogicDatabase.options.type;
		}
	}

	shard(){
		this.LogicDatabase.outputPort = new Port(this.LogicDatabase,true,true);
		this.LogicDatabase.options.isMasterShard = true;
		this.createPort(true);

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
			comp.onViewInit = () => {
				this.placingService.connectPorts(this.getPortComponent(true), comp.getPortComponent(false));
			}
			comp.onAfterDestroySelf = () => {
				if(this.LogicDatabase.outputPort.connections.length == 0)
					this.LogicDatabase.options.isMasterShard = false;
			}
		}
	}
}
