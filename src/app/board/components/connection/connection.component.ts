import { ChangeDetectorRef } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { SelectionService } from 'src/app/selection.service';
import { Connection } from 'src/models/Connection';
import { PortComponent } from '../port/port.component';

@Component({
  selector: 'connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionComponent implements OnInit {
  
  public portComponent1 : PortComponent;
  public portComponent2 : PortComponent;

  public LogicConnection : Connection;

  showData: boolean;

  @ViewChild("svg") svg;
  @ViewChild("mainPath") mainPath;
  @ViewChild("secondPath") secondPath;


  constructor(private cdRef:ChangeDetectorRef, private selectionService: SelectionService) 
  {

  }

  ngOnInit(): void {
    this.portComponent1.LogicPort.onRemoveConnection((conn) => {
      if(conn === this.LogicConnection){
        this.destroyComponent();
      }
    });
    this.portComponent2.LogicPort.onRemoveConnection((conn) => {
      if(conn === this.LogicConnection){
        this.destroyComponent();
      }    
    });
    this.LogicConnection.onSendData((data)=>{
      let dataSvg = document.createElementNS('http://www.w3.org/2000/svg','circle');
      this.svg.nativeElement.appendChild(dataSvg);
      let animX = document.createElementNS('http://www.w3.org/2000/svg','animate');
      let animY = document.createElementNS('http://www.w3.org/2000/svg','animate');

      animX.setAttribute("attributeName","cx")
      animY.setAttribute("attributeName","cy")

      animX.setAttribute("dur","0.18s")
      animY.setAttribute("dur","0.18s")

      animX.setAttribute("begin","0")
      animY.setAttribute("begin","0")

      dataSvg.setAttribute("r","5")
      dataSvg.setAttribute("fill","#31B78D")

      if(data === this.portComponent1.LogicPort){
        dataSvg.setAttribute("cx",(this.portComponent1.port.nativeElement.offsetLeft+this.portComponent1.port.nativeElement.clientWidth/2).toString())
        dataSvg.setAttribute("cy",(this.portComponent1.port.nativeElement.offsetTop+this.portComponent1.port.nativeElement.clientHeight/2).toString())
        animX.setAttribute("from", (this.portComponent1.port.nativeElement.offsetLeft+this.portComponent1.port.nativeElement.clientWidth/2).toString());
        animX.setAttribute("to", (this.portComponent2.port.nativeElement.offsetLeft+this.portComponent2.port.nativeElement.clientWidth/2).toString());
        animY.setAttribute("from", (this.portComponent1.port.nativeElement.offsetTop+this.portComponent1.port.nativeElement.clientHeight/2).toString());
        animY.setAttribute("to", (this.portComponent2.port.nativeElement.offsetTop+this.portComponent2.port.nativeElement.clientHeight/2).toString());
      }
      else{
        dataSvg.setAttribute("cx",(this.portComponent2.port.nativeElement.offsetLeft+this.portComponent2.port.nativeElement.clientWidth/2).toString())
        dataSvg.setAttribute("cy",(this.portComponent2.port.nativeElement.offsetTop+this.portComponent2.port.nativeElement.clientHeight/2).toString())
        animX.setAttribute("from", (this.portComponent2.port.nativeElement.offsetLeft+this.portComponent2.port.nativeElement.clientWidth/2).toString());
        animX.setAttribute("to", (this.portComponent1.port.nativeElement.offsetLeft+this.portComponent1.port.nativeElement.clientWidth/2).toString());
        animY.setAttribute("from", (this.portComponent2.port.nativeElement.offsetTop+this.portComponent2.port.nativeElement.clientHeight/2).toString());
        animY.setAttribute("to", (this.portComponent1.port.nativeElement.offsetTop+this.portComponent1.port.nativeElement.clientHeight/2).toString());
      }

      dataSvg.appendChild(animX);
      dataSvg.appendChild(animY);

      (animX as any).beginElement();
      (animY as any).beginElement();
      
      setTimeout(()=>{
        dataSvg.remove();
      },180)
    })
  }

  handleClick(){
    this.selectionService.setConnectionSelection(this);
  }

  destroySelf = () => {
    this.LogicConnection.destroy();
    this.destroyComponent();
  }

  destroyComponent = () => {}

  ngAfterViewChecked()
  {
    this.cdRef.detectChanges();
  }
}
