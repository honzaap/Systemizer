import { Component, OnInit } from '@angular/core';
import { Proxy } from 'src/models/Proxy';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-proxy',
	templateUrl: './proxy.component.html',
	styleUrls: ['./proxy.component.scss']
})
export class ProxyComponent extends OperatorComponent implements OnInit {

	public LogicProxy: Proxy = new Proxy();

	getLogicComponent(){
		return this.LogicProxy;
	}

	static getColor(): string{
		let c = new Proxy();
		return c.color;
	}
}