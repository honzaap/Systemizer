import { Component, OnInit } from '@angular/core';
import { Endpoint } from 'src/models/Endpoint';
import { MessageQueue } from 'src/models/MessageQueue';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-messagequeue',
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

	public getLogicComponent(){
		return this.LogicMessageQueue;
	}

	static getColor(): string{
		let c = new MessageQueue();
		return c.color;
	}
}
