import { Component, ComponentFactoryResolver, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
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
export class TextfieldComponent extends OperatorComponent implements OnInit{

	public LogicTextField : TextField = new TextField();
  	private currentSelectionService: SelectionService;

  	@ViewChild("field") field: ElementRef;
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver) {
		super(placingService, selectionService, resolver);
    	this.currentSelectionService = selectionService;
	}

	ngAfterViewInit(): void {
		super.Init(this.conn, false);
		this.field.nativeElement.addEventListener('keydown', function(e) {
			if (e.key == 'Tab') {
				e.preventDefault();
				var start = this.selectionStart;
				var end = this.selectionEnd;
			
				this.value = this.value.substring(0, start) +
					"\t" + this.value.substring(end);
			
				this.selectionStart =
					this.selectionEnd = start + 1;
			}
		});
  	}

	ngOnInit(){
	}

	public handleMousedown(event){
		if(this.currentSelectionService.currentSelections.indexOf(this) == -1)
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

	resize(e){
		this.LogicTextField.options.width = e.width;
		this.LogicTextField.options.height = e.height;
	}
}