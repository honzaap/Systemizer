import { Injectable } from '@angular/core';

@Injectable({
  	providedIn: 'root'
})
export class ViewingService {

	private HELPERS_KEY = "helpers";
	private helpersDisabled: boolean;

	private TITLES_KEY = "titles";
	private titlesHidden: boolean;

	constructor() { 
		this.helpersDisabled = localStorage.getItem(this.HELPERS_KEY) == "true" ? true : false;
		this.titlesHidden = localStorage.getItem(this.TITLES_KEY) == "true" ? true : false;
	}

	isHelpersDisabled(){
		return this.helpersDisabled;
	}

	setHelpersDisabled(disabled: boolean = true){
		localStorage.setItem(this.HELPERS_KEY, disabled.toString());
		this.helpersDisabled = disabled;
	}

	isTitlesHidden(){
		return this.titlesHidden;
	}

	setTitlesHidden(hidden: boolean = true){
		localStorage.setItem(this.TITLES_KEY, hidden.toString());
		this.titlesHidden = hidden;
	}
}