import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ExportService } from 'src/app/export.service';
import { ViewingService } from 'src/app/viewing.service';
import { IDataOperator } from 'src/interfaces/IDataOperator';

@Component({
	selector: 'component-title',
	templateUrl: './title.component.html',
	styleUrls: ['./title.component.scss'],
})
export class TitleComponent implements OnInit {

	@Input() Model: IDataOperator

	constructor(public viewingService: ViewingService, public exportService: ExportService, private cdRef: ChangeDetectorRef) { 
		viewingService.ViewUpdated.subscribe(() => {
			this.cdRef.detectChanges();
		})
	}

	ngOnInit(): void { 
		this.cdRef.detectChanges();
	}
}