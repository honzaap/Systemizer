import { Injectable } from '@angular/core';

class Change {
	/**
	 * Json state of board
	 */
	Board: any;

	constructor(Board: any) {
		this.Board = Board;
	}
}

@Injectable({
  	providedIn: 'root'
})
export class ChangesService {

	private undoStack: Change[] = [];
	private redoStack: Change[] = [];

  	constructor() { }

	/**
	 * Push the state of the board to undo stack
	 */
	public pushChange(state: string){
		if(state == null)
			return;
		let change = new Change(state);
		this.undoStack.push(change);
		this.redoStack = [];
	}

	/**
	 * Returns the json state of board
	 */
	public getUndo(currentState: string){
		let change = this.undoStack.pop();
		if(change == null)
			return null;
		this.redoStack.push(new Change(currentState));
		return change.Board;
	}

	/**
	 * Returns the json state of board
	 */
	public getRedo(): any{
		let change = this.redoStack.pop();
		if(change == null)
			return null;
		return change.Board;
	}

	/**
	 * Resets all changes 
	 */
	public reset(){
		this.redoStack = [];
		this.undoStack = [];
	}
}
