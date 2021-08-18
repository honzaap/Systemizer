import { Component, OnInit } from '@angular/core';
import { Cache } from "src/models/Cache";
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
    selector: 'cache',
    templateUrl: './cache.component.html',
    styleUrls: ['./cache.component.scss']
})
export class CacheComponent extends OperatorComponent implements OnInit {
    
    public LogicCache : Cache = new Cache();

    public getLogicComponent(){
        return this.LogicCache;
    }

    static getColor(): string{
		let c = new Cache();
		return c.color;
	}
}
