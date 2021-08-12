import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Endpoint } from 'src/models/Endpoint';
import { MessageQueue } from 'src/models/MessageQueue';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-messagequeue',
	templateUrl: './messagequeue.component.html',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	styleUrls: ['./messagequeue.component.scss']
})
export class MessagequeueComponent extends OperatorComponent implements OnInit {

	public LogicMessageQueue : MessageQueue = new MessageQueue();

	@ViewChild("conn", { read: ViewContainerRef }) conn;
	
	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef){
		super(placingService, selectionService, resolver, cdRef);
  	}

	handleEndpointUrlChange(endpoint: Endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == "")
			endpoint.url = "Message Queue";
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
		this.LogicMessageQueue.onReceiveData((data) => {
			if(!this.comp.classList.contains("anim")){
				this.comp.classList.add("anim");
				setTimeout(()=>{
					this.comp.classList.remove("anim");
				},500);
			}
			this.cdRef.detectChanges();
		});
		this.LogicMessageQueue.onSendData((data) => {
			this.cdRef.detectChanges();
		})
  	}

	ngOnInit(){
		this.cdRef.detectChanges();
	}

	getActionsElement(){
		return null;
	}

	public getLogicComponent(){
		return this.LogicMessageQueue;
	}

	static getColor(): string{
		let c = new MessageQueue();
		return c.color;
	}
}
