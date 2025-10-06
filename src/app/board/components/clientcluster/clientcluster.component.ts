import { Component, OnInit } from '@angular/core';
import { ClientCluster } from 'src/models/ClientCluster';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  selector: 'clientcluster',
  templateUrl: './clientcluster.component.html',
  styleUrls: ['./clientcluster.component.scss']
})
export class ClientclusterComponent extends OperatorComponent implements OnInit {
  LogicClientCluster: ClientCluster = new ClientCluster();

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    Promise.resolve().then(() => {
      if (!this.anchorRef?.nativeElement) return;
    });
  }

  public getLogicComponent(){
    return this.LogicClientCluster;
  }

  static getColor(): string{
    let c = new ClientCluster();
    return c.color;
  }

  ngOnInit(): void {}
}
