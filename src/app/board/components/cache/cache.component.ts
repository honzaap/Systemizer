import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { RequestData } from 'src/models/RequestData';
import { OperatorComponent } from '../Shared/OperatorComponent';
import { Cache } from "src/models/Cache"

@Component({
  selector: 'cache',
  queries: {
    anchorRef: new ViewChild( "anchorRef" ),
    optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions"),
    inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
  },
  templateUrl: './cache.component.html',
  styleUrls: ['./cache.component.scss']
})
export class CacheComponent extends OperatorComponent implements OnInit {

  public LogicCache : Cache = new Cache();

  constructor(placingService: PlacingService, selectionService: SelectionService) 
  {
    super(placingService, selectionService);
    this.LogicCache.onReceiveData((data) => {
      if(!this.comp.classList.contains("anim"))
      {
      this.comp.classList.add("anim");
      setTimeout(()=>{
        this.comp.classList.remove("anim");
      },500);
      }
      });
    }

  ngAfterViewInit(): void {
    super.Init();
    this.getPortComponent()
  }

  ngOnInit(){

  }

  getActionsElement(){
    return this.actionsRef;
  }

  destroySelf = () => {
    super.destroySelf();
    this.LogicCache.destroy();
    this.destroyComponent();
  }

  public getLogicComponent(){
    return this.LogicCache;
  }

  changeCacheWP(){

  }

  changeCacheRP(){

  }
}
