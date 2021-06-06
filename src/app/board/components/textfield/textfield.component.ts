import { ComponentFactoryResolver, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { TextField } from 'src/models/TextField';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  	selector: 'textfield',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions")
	},
	templateUrl: './textfield.component.html',
	styleUrls: ['./textfield.component.scss']
})
export class TextfieldComponent  extends OperatorComponent implements OnInit{

	public LogicTextField : TextField = new TextField();
  	private currentSelectionService: SelectionService

  	@ViewChild("field") field: ElementRef;
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver) {
		super(placingService, selectionService, resolver);
    	this.currentSelectionService = selectionService;
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	ngOnInit(){
	}

	public handleClick(){
		super.handleClick();
	}

	public handleMousedown(event){
		if(this.currentSelectionService.currentSelection !== this)
			super.handleMousedown(event);
	}

	public getLogicComponent(){
		return this.LogicTextField;
	}

	toggleBold(){
		this.LogicTextField.options.isBold = !this.LogicTextField.options.isBold;
	}

	toggleItalic(){
		this.LogicTextField.options.isItalic = !this.LogicTextField.options.isItalic;
	}
}