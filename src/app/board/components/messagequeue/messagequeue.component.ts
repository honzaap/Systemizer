import { Component, OnInit } from '@angular/core';
import { Endpoint } from 'src/models/Endpoint';
import { MessageQueue } from 'src/models/MessageQueue';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'messagequeue',
	templateUrl: './messagequeue.component.html',
	styleUrls: ['./messagequeue.component.scss']
})
export class MessagequeueComponent extends OperatorComponent implements OnInit {

	public LogicMessageQueue : MessageQueue = new MessageQueue();

	handleEndpointUrlChange(endpoint: Endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == "")
			endpoint.url = "Message Queue";
	}

	ngAfterViewInit(): void {
		super.Init();
		this.LogicMessageQueue.onReceiveData((data) => {
			this.setReceiveDataAnimation();
			this.cdRef.detectChanges();
		});
		this.LogicMessageQueue.onSendData((data) => {
			this.cdRef.detectChanges();
		})
  	}

	public getLogicComponent(){
		return this.LogicMessageQueue;
	}

	static getColor(): string{
		let c = new MessageQueue();
		return c.color;
	}
}
