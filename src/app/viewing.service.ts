import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  	providedIn: 'root'
})
export class ViewingService {

	public ViewUpdated = new EventEmitter();

	private HELPERS_KEY = "helpers";
	private helpersDisabled: boolean;

	private TITLES_KEY = "titles";
	private titlesHidden: boolean;

	private TECHNOLOGIES_KEY = "technologies";
	private technologiesHidden: boolean;

	private DARKMODE_KEY = "darkmode"
	private darkModeEnabled: boolean;

	private PERFORMANCEMODE_KEY = "performancemode"
	private performanceModeEnabled: boolean;

	private RESPONSES_KEY = "responses"
	private responsesHidden: boolean;

	constructor() { 
		this.helpersDisabled = localStorage.getItem(this.HELPERS_KEY) == "true" ? true : false;
		this.titlesHidden = localStorage.getItem(this.TITLES_KEY) == "true" ? true : false;
		this.technologiesHidden = localStorage.getItem(this.TECHNOLOGIES_KEY) == "true" ? true : false;
		this.darkModeEnabled = localStorage.getItem(this.DARKMODE_KEY) == "true" ? true : false;
		this.performanceModeEnabled = localStorage.getItem(this.PERFORMANCEMODE_KEY) == "true" ? true : false;
		this.responsesHidden = localStorage.getItem(this.RESPONSES_KEY) == "true" ? true : false;
	}

	isHelpersDisabled(){
		return this.helpersDisabled;
	}

	setHelpersDisabled(disabled: boolean = true){
		localStorage.setItem(this.HELPERS_KEY, disabled.toString());
		this.helpersDisabled = disabled;
		this.ViewUpdated.emit();
	}

	isTitlesHidden(){
		return this.titlesHidden;
	}

	setTitlesHidden(hidden: boolean = true, saveToLocalStorage: boolean = true){
		if(saveToLocalStorage)
			localStorage.setItem(this.TITLES_KEY, hidden.toString());
		this.titlesHidden = hidden;
		this.ViewUpdated.emit();
	}

	isTechnologiesHidden(){
		return this.technologiesHidden;
	}

	setTechnologiesHidden(hidden: boolean = true, saveToLocalStorage: boolean = true){
		if(saveToLocalStorage)
			localStorage.setItem(this.TECHNOLOGIES_KEY, hidden.toString());
		this.technologiesHidden = hidden;
		this.ViewUpdated.emit();
	}

	isDarkMode(){
		return this.darkModeEnabled;
	}

	setDarkMode(enabled: boolean = true, saveToLocalStorage: boolean = true){
		if(saveToLocalStorage)
			localStorage.setItem(this.DARKMODE_KEY, enabled.toString());
		if(enabled)
			document.documentElement.classList.add("dark-mode");
		else 
			document.documentElement.classList.remove("dark-mode");
		this.darkModeEnabled = enabled;
		this.ViewUpdated.emit();
	}

	isPerformanceMode(){
		return this.performanceModeEnabled;
	}

	setPerformanceMode(enabled: boolean = true, saveToLocalStorage: boolean = true){
		if(saveToLocalStorage)
			localStorage.setItem(this.PERFORMANCEMODE_KEY, enabled.toString());
		this.performanceModeEnabled = enabled;
	}

	isResponsesHidden(){
		return this.responsesHidden;
	}

	setResponsesHidden(hidden: boolean = true, saveToLocalStorage: boolean = true){
		if(saveToLocalStorage)
			localStorage.setItem(this.RESPONSES_KEY, hidden.toString());
		this.responsesHidden = hidden;
	}
}