import { Component, OnInit } from '@angular/core';
import { ViewingService } from 'src/app/viewing.service';

@Component({
  selector: 'pages-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class PagesHeaderComponent implements OnInit {

  constructor(public viewingService: ViewingService) { }

  ngOnInit(): void {
  }
}
