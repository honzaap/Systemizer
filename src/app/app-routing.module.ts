import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateComponent } from './create/create.component';
import { LandingPageComponent } from './landing-page/landing-page.component';

const routes: Routes = [
  
  {
    path: "create",
    component: CreateComponent
  },
  {
    path: "**",
    component: LandingPageComponent,
    /*children: [

    ]*/
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
