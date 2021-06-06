import { ViewContainerRef } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { DatabaseType } from 'src/models/enums/DatabaseType';
import { LoadBalancerType } from 'src/models/enums/LoadBalancerType';
import { WritePolicy } from 'src/models/enums/WritePolicy';
import { ApiComponent } from '../board/components/api/api.component';
import { ApiGatewayComponent } from '../board/components/apigateway/apigateway.component';
import { CacheComponent } from '../board/components/cache/cache.component';
import { ClientComponent } from '../board/components/client/client.component';
import { DatabaseComponent } from '../board/components/database/database.component';
import { LoadbalancerComponent } from '../board/components/loadbalancer/loadbalancer.component';
import { MessagequeueComponent } from '../board/components/messagequeue/messagequeue.component';
import { PubsubComponent } from '../board/components/pubsub/pubsub.component';
import { TextfieldComponent } from '../board/components/textfield/textfield.component';
import { WebserverComponent } from '../board/components/webserver/webserver.component';
import { PlacingService } from '../placing.service';

class MenuItem<T>{
	component: T;
	caption: string;
	mark: string;
	imageUrl: string;
	presetOptions: Object;

	constructor(component: T, caption: string, mark: string, imageUrl: string, presetOptions: Object = null) {
		this.component = component;
		this.caption = caption;
		this.mark = mark;
		this.imageUrl = imageUrl;
		this.presetOptions = presetOptions;
	}
}

class Category{
	title: string;
	items: MenuItem<any>[];
	isOpen: boolean;

	constructor(title: string, items: MenuItem<any>[] = []) {
		this.title = title;
		this.items = items;
	}
}

@Component({
	selector: 'app-componentmenu',
	templateUrl: './componentmenu.component.html',
	styleUrls: ['./componentmenu.component.scss']
})
export class ComponentmenuComponent implements OnInit {

	allCategories: Category[] = [];
	categories: Category[] = [];
	isOpen: boolean = true;

	currentItem: MenuItem<any>;
	placingItem: MenuItem<any>;

	@ViewChild("board", { read: ViewContainerRef }) connectionRef;
	@ViewChild("placingItemRef") placingItemRef;

	constructor(private placingService: PlacingService) 
	{
		// Create Categories
		this.allCategories.push(new Category("Client-side",[
			new MenuItem(ClientComponent, "Basic Client", "","../../assets/client.svg")
		]));
		this.allCategories.push(new Category("Server-side",[
			new MenuItem(WebserverComponent, "Static HTTP Web Server", "HTTP","../../assets/webserver.svg"),
			new MenuItem(ApiGatewayComponent, "Web API Gateway", "GW","../../assets/apigateway.svg"),
			new MenuItem(ApiComponent, "Web API Service", "API","../../assets/api.svg"),
		]));
		this.allCategories.push(new Category("Databases",[
			new MenuItem(DatabaseComponent, "SQL Database", "SQL","../../assets/database.svg", { type: DatabaseType.SQL }),
			new MenuItem(DatabaseComponent, "NoSQL Database", "NoSQL","../../assets/database.svg", { type: DatabaseType.NoSQL }),
		]));
		this.allCategories.push(new Category("Caches",[
			new MenuItem(CacheComponent, "Write-Through Cache", "WT","../../assets/cache.svg", { writePolicy: WritePolicy['Write-Through'] }),
			new MenuItem(CacheComponent, "Write-Back Cache", "WB","../../assets/cache.svg", { writePolicy: WritePolicy['Write-Back (Behind)'] })
		]));
		this.allCategories.push(new Category("Load Balancers",[
			new MenuItem(LoadbalancerComponent, "Layer 7 Load Balancer", "L7","../../assets/loadbalancer.svg"),
			new MenuItem(LoadbalancerComponent, "Layer 4 Load Balancer", "L4","../../assets/loadbalancer.svg", { type: LoadBalancerType['Layer 4'] })
		]));/*
		this.allCategories.push(new Category("Proxies",[
		]));*/
		this.allCategories.push(new Category("Async Communication",[
			new MenuItem(MessagequeueComponent, "Message Queue", "MQ","../../assets/messagequeue.svg"),
			new MenuItem(PubsubComponent, "Publisher/Subscriber Model", "PUBSUB","../../assets/pubsub.svg"),
		]));
		this.allCategories.push(new Category("Other",[
			new MenuItem(TextfieldComponent, "Text Field", "TEXT","../../assets/text.svg"),
		]));
		this.categories = this.allCategories;
	}

	toggleWindow(){
		this.isOpen = !this.isOpen;
		this.categories = this.allCategories;
	}

	search(value: string){
		this.categories = [];
		for(let category of this.allCategories){
			let relevantItems = category.items.filter(i => this.isSearchRelevant(i, value));
			if(relevantItems.length > 0)
				this.categories.push(new Category(category.title ,relevantItems));
		}
	}

	hoverItem(item: MenuItem<any>){
		this.currentItem = item;
	}

	leaveItem(){
		this.currentItem = null;
	}

	isSearchRelevant(item: MenuItem<any>, searchValue: string){
		let isRelevant = item.caption.toLowerCase().indexOf(searchValue.toLowerCase()) != -1;
		isRelevant = isRelevant ||  item.mark.toLowerCase().indexOf(searchValue.toLowerCase()) != -1;
		return isRelevant;
	}
	
	dragItem(item: MenuItem<any>){
		this.placingService.startCreating(item.component, item.presetOptions);
		this.placingItem = item;

		window.addEventListener("mousemove", this.mouseMove);
		window.addEventListener("mouseup", this.mouseUp);
		return false;
	}

	mouseUp = () =>{
		this.placingItem = null;
		window.removeEventListener("mouseup",this.mouseUp);
		window.removeEventListener("mousemove",this.mouseMove);
		this.placingService.creatingItem = null;
		this.placingService.stopCreating();
	}

	mouseMove = (e) =>{
		this.placingItemRef.nativeElement.style.width = `${40*Math.max(1,this.placingService.boardScale)}px`;
		this.placingItemRef.nativeElement.style.height = `${40*Math.max(1,this.placingService.boardScale)}px`;
		this.placingItemRef.nativeElement.style.left = `${e.clientX-(20*Math.max(1,this.placingService.boardScale))}px`;
		this.placingItemRef.nativeElement.style.top = `${e.clientY-(20*Math.max(1,this.placingService.boardScale))}px`;
	}

	ngOnInit(): void {
	}

	ngAfterViewInit(){
	}
}
