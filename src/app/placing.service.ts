import { ComponentFactory, ViewContainerRef } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { ComponentRef } from '@angular/core';
import { Type } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Injectable } from '@angular/core';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { PortComponent } from './board/components/port/port.component';

@Injectable({
  providedIn: 'root'
})
export class PlacingService{

  @ViewChild("board", { read: ViewContainerRef }) board;


  isPlacing = false;
  isConnecting = false;
  canMoveConnection = true;
  isCreating = false;

  connectingPort : PortComponent;
  connectionRef : ViewContainerRef;

  canDrag = () => {return !this.isPlacing && !this.isConnecting};

  boardScale = 1;

  creatingItem: any;
  creatingItemOptions: any;

  copiedItem: any;
  copiedItemOptions: any;

  startCreating(creatingItem: any, options: any){
    this.isCreating = true;
    this.creatingItem = creatingItem;
    this.creatingItemOptions = options;
  }

  stopCreating(){
    this.isCreating = false;
    this.creatingItem = null;
    this.creatingItemOptions = null;
  }

  startPlacing(){
    this.isPlacing = true;
  }

  stopPlacing(){
    this.isPlacing = false;
  }

  startConnecting(portComponent: PortComponent){
    let board = document.getElementById("board");
    board.classList.remove("infocus");
    this.isConnecting = true;
    this.connectingPort = portComponent;
  }

  stopConnecting(){
    let board = document.getElementById("board");
    board.classList.add("infocus");
    board.onmousemove = null;
    this.isConnecting = false;
    this.connectingPort = null;
  }

  copyItem(item: any, options: any){
    if(item == null) return;
    this.copiedItem = item;
    this.copiedItemOptions = options;
  }

  pasteItem(){
    if(this.copiedItem != null){
      let options = this.clone(this.copiedItemOptions);
      console.log(options);
      this.createComponent(this.copiedItem, 300, 300, options);
    }
  }

  public clone(object: any): any {
    var cloneObj = new (object.constructor as any);
    for (var attribut in object) {
        if (typeof object[attribut] === "object" && object[attribut] != null) {
            cloneObj[attribut] = this.clone(object[attribut]);
        } else {
            cloneObj[attribut] = object[attribut];
        }
    }
    return cloneObj;
}

  connectPorts(portComponent1: PortComponent, portComponent2: PortComponent){
    // Create connection component
    //this.connectionRef.clear(); 

    
    let factory : ComponentFactory<ConnectionComponent> = this.resolver.resolveComponentFactory(ConnectionComponent);
    let c : ComponentRef<ConnectionComponent>  = this.connectionRef.createComponent(factory);
    
    let logicConn = portComponent1.LogicPort.connectTo(portComponent2.LogicPort);
    if(logicConn == null){
      c.destroy();
      return
    }
    c.instance.LogicConnection = logicConn;

    c.instance.destroyComponent = () => {
      c.destroy();
    }

    c.instance.portComponent1 = portComponent1;
    c.instance.portComponent2 = portComponent2;
  }

  public createComponent<T>(component: Type<T>, left = 100, top = 100, options: any) {
    if(component == null) return;
    let factory  = this.resolver.resolveComponentFactory(component);
    let c : any = this.connectionRef.createComponent(factory);
    let comp = c.instance.getLogicComponent();

    c.instance.destroyComponent = () => {
      c.destroy();
    }

    if(options != null){
      for(let key of Object.keys(options)){
        comp.options[key] = options[key];
      }
    }

    comp.options.X = left;
    comp.options.Y = top;
    return c.instance;
  }

  constructor(private resolver: ComponentFactoryResolver) 
  {
  }
}
