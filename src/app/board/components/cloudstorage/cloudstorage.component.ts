import { Component, OnInit } from '@angular/core';
import { CloudStorage } from 'src/models/CloudStorage';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'cloudstorage',
	templateUrl: './cloudstorage.component.html',
	styleUrls: ['./cloudstorage.component.scss']
})
export class CloudStorageComponent extends OperatorComponent implements OnInit {

	public LogicCloudStorage : CloudStorage = new CloudStorage();

	public getLogicComponent(){
		return this.LogicCloudStorage;
	}

	static getColor(): string{
		let c = new CloudStorage();
		return c.color;
	}
}