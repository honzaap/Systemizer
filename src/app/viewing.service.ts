import { Injectable } from '@angular/core';

@Injectable({
  	providedIn: 'root'
})
export class ViewingService {

	private HELPERS_KEY = "helpers";
	private helpersDisabled;

	constructor() { 
		this.helpersDisabled = localStorage.getItem(this.HELPERS_KEY);
		if(this.helpersDisabled == null)
			this.helpersDisabled = false;
	}

	isHelpersDisabled(){
		return this.helpersDisabled;
	}

	setHelpersDisabled(disabled: boolean = true){
		localStorage.setItem(this.HELPERS_KEY, disabled.toString());
		this.helpersDisabled = disabled;
	}
}