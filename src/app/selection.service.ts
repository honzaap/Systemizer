import { Type } from '@angular/core';
import { Injectable } from '@angular/core';
import { EventDispatcher, Handler } from 'src/models/Shared/EventDispatcher';
import { ClientComponent } from './board/components/client/client.component';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { OperatorComponent } from './board/components/Shared/OperatorComponent';

interface ChangeSelectionEvent {};

@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  currentSelection: OperatorComponent;
  currentConnectionSelection: ConnectionComponent;

  setSelection(selection: OperatorComponent){
    if(selection != this.currentSelection){
      if(this.currentSelection != null){
        this.currentSelection.anchorRef.nativeElement.classList.remove("is-current-selection")
      }
      selection.anchorRef.nativeElement.classList.add("is-current-selection")
      this.currentSelection = selection;
      this.clearConnectionSelection();
      this.fireChangeSelection({});
    }
  }

  clearSelection(){
    if(this.currentSelection != null){
      this.currentSelection.anchorRef.nativeElement.classList.remove("is-current-selection")
      this.currentSelection = null;
      this.fireChangeSelection({});
    }  
  }

  // Connection
  setConnectionSelection(selection: ConnectionComponent){
    if(selection != this.currentConnectionSelection){
      if(this.currentConnectionSelection != null){
        this.currentConnectionSelection.mainPath.nativeElement.classList.remove("is-current-selection")
        this.currentConnectionSelection.secondPath.nativeElement.classList.remove("is-current-selection")
      }
      selection.mainPath.nativeElement.classList.add("is-current-selection")
      selection.secondPath.nativeElement.classList.add("is-current-selection")
      this.currentConnectionSelection = selection;
      this.clearSelection();
      this.fireChangeSelection({});
    }
  }

  clearConnectionSelection(){
    if(this.currentConnectionSelection != null){
      this.currentConnectionSelection.mainPath.nativeElement.classList.remove("is-current-selection")
      this.currentConnectionSelection.secondPath.nativeElement.classList.remove("is-current-selection")
      this.currentConnectionSelection = null;
      this.fireChangeSelection({});
    }  
  }

  deleteSelection(){
    if(this.currentConnectionSelection == null && this.currentSelection == null){
      return;
    }
    if(this.currentConnectionSelection){
      this.currentConnectionSelection.destroySelf();
      this.clearSelection();
      this.clearConnectionSelection();
      return;
    }
    this.currentSelection.destroySelf();    
    this.clearSelection();
    this.clearConnectionSelection();
  }

  constructor() { }

  private changeSelectionDispatcher = new EventDispatcher<ChangeSelectionEvent>();
  public onChangeSelection(handler: Handler<ChangeSelectionEvent>) {
      this.changeSelectionDispatcher.register(handler);
  }
  private fireChangeSelection(event: ChangeSelectionEvent) { 
      this.changeSelectionDispatcher.fire(event);
  }


}
