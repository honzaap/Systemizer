import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

export class TutorialSlide{
	image: string;
	title: string;
	text: string;

	constructor(image: string, title: string, text: string){
		this.image = image;
		this.title = title;
		this.text = text;
	}
}

@Component({
	selector: 'tutorial-controls',
	templateUrl: './tutorial-controls.component.html',
	styleUrls: ['./tutorial-controls.component.scss']
})
export class TutorialControlsComponent implements OnInit {

	@Output() closeMenu = new EventEmitter();
	
	slides: TutorialSlide[] = [];
	isMinimized = false;
	currentSlideIndex = 0;
	currentSlide: TutorialSlide;
  	
	constructor() { 
		this.slides.push(new TutorialSlide("gifs/tutorial0.gif", "Welcome to Systemizer!", "This quick tutorial will take you through the basics of this design tool."));
		this.slides.push(new TutorialSlide("gifs/tutorial1.gif", "Moving the board", "To move the board, you can use the left mouse button. To zoom in or out, use the mouse wheel."));
		this.slides.push(new TutorialSlide("gifs/tutorial2.gif", "Create components ", "To create a component, simply drag & drop the component from the component menu."));
		this.slides.push(new TutorialSlide("gifs/tutorial3.gif", "Move components", "To move a component on the board, simply click on the component and hold, then move it with mouse."));
		this.slides.push(new TutorialSlide("gifs/tutorial4.gif", "Copy and paste components", "Copy and paste can be done by selecting component and using keyboard shortcuts, or by using top menu copy/paste buttons."));
		this.slides.push(new TutorialSlide("gifs/tutorial5.gif", "Remove components", 'Removing components can be done by selecting component and pressing the [del] button, or by using top menu remove button.'));
		this.slides.push(new TutorialSlide("gifs/tutorial6.gif", "Connecting components", 'To connect components together, click and hold on a port of component, then drag the connection to the second component port and release.'));
		this.slides.push(new TutorialSlide("gifs/tutorial7.gif", "Changing properties", 'Properties of component can be altered by selecting the component, and accessing the "Properties" section in the options side menu.'));
		this.currentSlide = this.slides[0];
	}	

	ngOnInit(): void {
	}

  	close(){
		this.closeMenu.emit();
	}

	toggleMinimize(){
		this.isMinimized = !this.isMinimized;
	}

	previous(){
		this.currentSlideIndex--;
		this.currentSlide = this.slides[this.currentSlideIndex];
	}

	next(){
		this.currentSlideIndex++;
		this.currentSlide = this.slides[this.currentSlideIndex];
	}
}
