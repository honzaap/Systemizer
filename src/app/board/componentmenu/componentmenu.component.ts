import { Component, OnInit, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ViewingService } from 'src/app/viewing.service';
import { DatabaseType } from 'src/models/enums/DatabaseType';
import { LoadBalancerType } from 'src/models/enums/LoadBalancerType';
import { WritePolicy } from 'src/models/enums/WritePolicy';
import { PlacingService } from '../../placing.service';
import { ApiComponent } from '../components/api/api.component';
import { ApiGatewayComponent } from '../components/apigateway/apigateway.component';
import { CacheComponent } from '../components/cache/cache.component';
import { ClientComponent } from '../components/client/client.component';
import { ClientclusterComponent } from '../components/clientcluster/clientcluster.component';
import { CloudStorageComponent } from '../components/cloudstorage/cloudstorage.component';
import { DatabaseComponent } from '../components/database/database.component';
import { LoadbalancerComponent } from '../components/loadbalancer/loadbalancer.component';
import { MessagequeueComponent } from '../components/messagequeue/messagequeue.component';
import { ProxyComponent } from '../components/proxy/proxy.component';
import { PubsubComponent } from '../components/pubsub/pubsub.component';
import { TextfieldComponent } from '../components/textfield/textfield.component';
import { WebserverComponent } from '../components/webserver/webserver.component';
import { CDNComponent } from '../components/cdn/cdn.component';

class MenuItem<T>{
	component: T;
	caption: string;
	mark: string;
	imageUrl: string;
	presetOptions: Object;
	info: string;
	color: string;

	constructor(component: T, caption: string, mark: string, imageUrl: string,info: string, presetOptions: Object = null) {
		this.component = component;
		this.caption = caption;
		this.mark = mark;
		this.imageUrl = imageUrl;
		this.presetOptions = presetOptions;
		this.info = info;
		this.color = (component as any).getColor() || "#6059DF";
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
	styleUrls: ['./componentmenu.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ComponentmenuComponent implements OnInit {

	allCategories: Category[] = [];
	categories: Category[] = [];
	isOpen: boolean = true;
	currentInfoComponent: MenuItem<any>;
	isInfoOpen: boolean = false;

	currentItem: MenuItem<any>;
	placingItem: MenuItem<any>;

	@ViewChild("board", { read: ViewContainerRef }) connectionRef;
	@ViewChild("placingItemRef") placingItemRef;

	constructor(private placingService: PlacingService, public viewingService: ViewingService) 
	{
		// Create Categories
		this.allCategories.push(new Category("Client-side",[
			new MenuItem(ClientComponent, "Basic Client", "","./assets/client.svg", '<p>Client is the component, that simulates either a real client, or client side application on any device.</p><p>Use the output port to connect to other compoenents via their input port. Select endpoint you want to connect to and the HTTP method used.</p><p>Once connected to an endpoint, you can use the <span class="highlight">Send data</span> button. To send data automatically, use the loop icon next to <span class="highlight">Send data</span> button.</p>'),
			new MenuItem(ClientclusterComponent, "Client Cluster", "","./assets/clientcluster.svg", '<p>Client cluster represents multiple clients. It sends data to any endpoint available at given speed.<p>To start sending data, click the <span class="highlight">Start sending data</span> button.</p>')
		]));
		this.allCategories.push(new Category("Server-side",[
			new MenuItem(WebserverComponent, "HTTP Web Server", "HTTP","./assets/webserver.svg", '<p>Web server component simulates an HTTP web server that can accept requests and send them to an API.</p><p>Use the input port to connect a client and the output port to connect other services and APIs.</p>'),
			new MenuItem(ApiGatewayComponent, "Web API Gateway", "GW","./assets/apigateway.svg", '<p>API gateway is used to reduce number of requests, the client needs to send.</p><p>Use the input port to connect a client and the output port to connect other services and APIs.</p><p>There are 5 types of endpoints available, every type has some unique properties. Each endpoint can have actions that will be triggered on each request. For more info about each endpoint type, use the <span class="highlight">?</span> icon.</p>'),
			new MenuItem(ApiComponent, "Web API Service", "API","./assets/api.svg", '<p>API is general component to simulate any API or microservice.</p> <p>Use the input port to connect a client and the output port to connect other services and APIs. </p> <p>API can be of 5 available types, each used for different purposes. You can add any number of endpoints that can have different actions like sending new requests to other APIs or storing data to database.</p>'),
		]));
		this.allCategories.push(new Category("Storage",[
			new MenuItem(DatabaseComponent, "SQL Database", "SQL","./assets/database.svg", '<p>Database component simulates a database server with one default endpoint.</p> <p>Use the input port to connect services to database and receive data through.</p> <p>You can use the <span class="highlight">Shard Database</span> action to shard the database and create 3 default shards. </p>',{ type: DatabaseType.SQL }),
			new MenuItem(DatabaseComponent, "NoSQL Database", "NoSQL","./assets/database.svg",'<p>Database component simulates a database server with one default endpoint.</p> <p>Use the input port to connect services to database and receive data through.</p> <p>You can use the <span class="highlight">Shard Database</span> action to shard the database and create 3 default shards. </p>', { type: DatabaseType.NoSQL }),
			new MenuItem(CloudStorageComponent, "Cloud Storage", "CLOUD","./assets/cloudstorage.svg",'<p>Cloud storage component simulates any cloud storage with one default endpoint.</p> <p>Use the input port to connect services to cloud and receive data through.</p>'),
			new MenuItem(CDNComponent, "Content Delivery Network", "CDN","./assets/cdn.svg",'<p>CDN component simulates a Content Delivery Network with one default endpoint.</p> <p>Use the input port to connect services to CDN and receive data through.</p>'),
		]));
		this.allCategories.push(new Category("Caches",[
			new MenuItem(CacheComponent, "Write-Through Cache", "WT","./assets/cache.svg", '<p>Cache component simulates a distributed cache with a <span class="underline">random</span> hit/miss chance.</p> <p>Receive data through input port. The output port is connected to <span class="highlight">Database</span>.</p> <p>You can change Write and Replacement policies to better specify the behaviour of your cache.</p>', { writePolicy: WritePolicy['Write-Through'] }),
			new MenuItem(CacheComponent, "Write-Back Cache", "WB","./assets/cache.svg", '<p>Cache component simulates a distributed cache with a <span class="underline">random</span> hit/miss chance.</p> <p>Receive data through input port. The output port is connected to <span class="highlight">Database</span>.</p> <p>You can change Write and Replacement policies to better specify the behaviour of your cache.</p>', { writePolicy: WritePolicy['Write-Back (Behind)'] })
		]));
		this.allCategories.push(new Category("Load Balancers & Proxies",[
			new MenuItem(LoadbalancerComponent, "Layer 7 Load Balancer", "L7","./assets/loadbalancer.svg", '<p>Load Balancer component is used to balance load between multiple services. </p> <p>Use the input port to receive data and balance it between connections on output port.</p> <p>Load balancer can work in <span class="highlight">Layer 7</span> or <span class="highlight">Layer 4</span> mode. You can change the balance algorithm to any of 4 available types. </p> '),
			new MenuItem(LoadbalancerComponent, "Layer 4 Load Balancer", "L4","./assets/loadbalancer.svg", '<p>Load Balancer component is used to balance load between multiple services. </p> <p>Use the input port to receive data and balance it between connections on output port.</p> <p>Load balancer can work in <span class="highlight">Layer 7</span> or <span class="highlight">Layer 4</span> mode. You can change the balance algorithm to any of 4 available types. </p> ', { type: LoadBalancerType['Layer 4'] }),
			new MenuItem(ProxyComponent, "Proxy", "PROXY","./assets/proxy.svg", '<p>Proxy component acts like a man in the middle between client and server. </p> <p>Use the input port to receive data and route it to server through output port.</p>')
		]));
		this.allCategories.push(new Category("Async Communication",[
			new MenuItem(MessagequeueComponent, "Message Queue", "MQ","./assets/messagequeue.svg", '<p>Message Queue component is used to simulate a single message queue, <span class="underline">not a full fledged message broker</span>.</p> <p>To publish message to queue, use the input port and send data to an endpoint. Consumers can be connected to output port of message queue. These <span class="underline">consumers need to have an endpoint with the same URL</span>.</p> <p>Message can be only send to one consumer. In case of more consumers, the messages will be sent in round robin manner. Consumers can perform actions on data receive. </p> '),
			new MenuItem(PubsubComponent, "Publisher/Subscriber Model", "PUBSUB","./assets/pubsub.svg", '<p>Pub/Sub is used for publishers sending data to a specified topic, to which can be connected any number of subscribers.</p> <p>To publish a message, connect to input port and select a topic as an endpoint. You can create any number of topics. Subcribers connect to output port and select any number of topics they want to subscribe. <span class="underline">Subcribers must have an endpoint with the same url as the topic they subscribe</span>.</p>'),
		]));
		this.allCategories.push(new Category("Other",[
			new MenuItem(TextfieldComponent, "Text Field", "TEXT","./assets/text.svg", '<p>General text field with customizable font size and style.</p>'),
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

		window.addEventListener("touchmove", this.mouseMove);
		window.addEventListener("touchend", this.mouseUp);
		return false;
	}

	mouseUp = () =>{
		this.placingItem = null;
		window.removeEventListener("mouseup",this.mouseUp);
		window.removeEventListener("mousemove",this.mouseMove);

		window.removeEventListener("touchend",this.mouseUp);
		window.removeEventListener("touchmove",this.mouseMove);
		
		this.placingService.creatingItem = null;
		this.placingService.stopCreating();
		return true;
	}

	mouseMove = (e: Event) =>{
		if(e instanceof MouseEvent){
			this.placingItemRef.nativeElement.style.width = `${40*Math.max(1,this.placingService.boardScale)}px`;
			this.placingItemRef.nativeElement.style.height = `${40*Math.max(1,this.placingService.boardScale)}px`;
			this.placingItemRef.nativeElement.style.left = `${e.clientX-(20*Math.max(1,this.placingService.boardScale))}px`;
			this.placingItemRef.nativeElement.style.top = `${e.clientY-(20*Math.max(1,this.placingService.boardScale))}px`;
		}
		else if(e instanceof TouchEvent){
			this.placingItemRef.nativeElement.style.width = `${40*Math.max(1,this.placingService.boardScale)}px`;
			this.placingItemRef.nativeElement.style.height = `${40*Math.max(1,this.placingService.boardScale)}px`;
			this.placingItemRef.nativeElement.style.left = `${e.touches[0].clientX-(20*Math.max(1,this.placingService.boardScale))}px`;
			this.placingItemRef.nativeElement.style.top = `${e.touches[0].clientY-(20*Math.max(1,this.placingService.boardScale))}px`;
		}
	}

	showInfo(item: MenuItem<any>){
		this.currentInfoComponent = item;
		this.isInfoOpen = true;
	}

	closeInfo(){
		this.isInfoOpen = false;
		this.currentInfoComponent = null;
	}

	ngOnInit(): void {
	}

	ngAfterViewInit(){
	}
}
