import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { Options } from 'src/models/Options';
import { clone } from 'src/shared/ExtensionMethods';

class Change {
	component: IDataOperator;
	beforeOptions: Options;

	constructor(component: IDataOperator, beforeOptions: Options) {
		this.component = component;
		this.beforeOptions = beforeOptions;
	}
}

@Injectable({
  	providedIn: 'root'
})
export class ChangesService {

	private undoStack: Change[] = [];
	private redoStack: Change[] = [];

  	constructor() { }

	public pushChange(component: IDataOperator, beforeOptions: Options){
		let change = new Change(component, beforeOptions);
		this.undoStack.push(change);
		this.redoStack = [];
	}

	public undo(){
		let change = this.undoStack.pop();
		if(change == null)
			return;
		let redoChange = new Change(change.component, clone(change.component.options));
		change.component.options = change.beforeOptions;
		this.redoStack.push(redoChange);
	}

	public redo(){
		let change = this.redoStack.pop();
		if(change == null)
			return;
		let redoChange = new Change(change.component, clone(change.component.options));
		change.component.options = change.beforeOptions;
	}
}
