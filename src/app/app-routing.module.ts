import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateComponent } from './create/create.component';
import { GettingStartedComponent } from './pages/getting-started/getting-started.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { PagesComponent } from './pages/pages.component';

const routes: Routes = [
  
  {
    path: "create",
    component: CreateComponent,
  },
  {
    path: "",
    component: PagesComponent,
    children: [
      {
        path: "getting-started",
        component: GettingStartedComponent

      },
      {
        path: "**",
        component: LandingPageComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
