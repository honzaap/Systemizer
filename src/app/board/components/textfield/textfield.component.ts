import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TextField } from 'src/models/TextField';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  	selector: 'textfield',
	templateUrl: './textfield.component.html',
	styleUrls: ['./textfield.component.scss']
})
export class TextfieldComponent extends OperatorComponent implements OnInit{

	public LogicTextField : TextField = new TextField();

  	@ViewChild("field") field: ElementRef;

	ngAfterViewInit(): void {
		super.Init(false);
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
		this.cdRef.detectChanges();
	}

	public handleMousedown(event){
		if(this.selectionService.currentSelections.indexOf(this) == -1)
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