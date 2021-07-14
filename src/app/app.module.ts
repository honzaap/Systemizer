import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from "@angular/material/slider"

import { BrowserModule, EVENT_MANAGER_PLUGINS } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DelayedHoverDirective } from "../shared/DelayedHoverDirective";
import { ResizableTextAreaDirective } from "../shared/resizable-textarea";
import { VueEventModifiersPlugin } from "../shared/vue-event-modifiers.plugin";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BoardComponent } from './board/board.component';
import { ComponentmenuComponent } from './board/componentmenu/componentmenu.component';

import { ApiComponent } from './board/components/api/api.component';
import { ApiGatewayComponent } from './board/components/apigateway/apigateway.component';
import { CacheComponent } from './board/components/cache/cache.component';
import { ClientComponent } from './board/components/client/client.component';
import { CloudStorageComponent } from './board/components/cloudstorage/cloudstorage.component';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { DatabaseComponent } from './board/components/database/database.component';
import { LoadbalancerComponent } from './board/components/loadbalancer/loadbalancer.component';
import { MessagequeueComponent } from './board/components/messagequeue/messagequeue.component';
import { PortComponent } from './board/components/port/port.component';
import { PubsubComponent } from './board/components/pubsub/pubsub.component';
import { TitleComponent } from './board/components/Shared/title/title.component';
import { TextfieldComponent } from './board/components/textfield/textfield.component';
import { WebserverComponent } from './board/components/webserver/webserver.component';
import { ProxyComponent } from './board/components/proxy/proxy.component';
import { ClientclusterComponent } from './board/components/clientcluster/clientcluster.component';

import { BoardUIComponent } from './board/boardUI/boardUI.component';
import { OptionsmenuComponent } from './board/optionsmenu/optionsmenu.component';
import { TutorialControlsComponent } from './board/tutorials/tutorial-controls/tutorial-controls.component';
import { CreateComponent } from './create/create.component';
import { InfoTooltipComponent } from './info-tooltip/info-tooltip.component';
import { FooterComponent } from './pages/footer/footer.component';
import { GettingStartedComponent } from './pages/getting-started/getting-started.component';
import { PagesHeaderComponent } from './pages/header/header.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { PagesComponent } from './pages/pages.component';

@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    BoardUIComponent,
    ClientComponent,
    ConnectionComponent,
    PortComponent,
    WebserverComponent,
    LoadbalancerComponent,
    ComponentmenuComponent,
    DelayedHoverDirective,
    OptionsmenuComponent,
    ApiComponent,
    ApiGatewayComponent,
    TextfieldComponent,
    ResizableTextAreaDirective,
    DatabaseComponent,
    CacheComponent,
    MessagequeueComponent,
    PubsubComponent,
    CreateComponent,
    PagesComponent,
    FooterComponent,
    PagesHeaderComponent,
    TutorialControlsComponent,
    GettingStartedComponent,
    LandingPageComponent,
    InfoTooltipComponent,
    TitleComponent,
    CloudStorageComponent,
    ProxyComponent,
    ClientclusterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatExpansionModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSliderModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [
		{
			provide: EVENT_MANAGER_PLUGINS,
			useClass: VueEventModifiersPlugin,
			multi: true
		}
	],
  bootstrap: [AppComponent]
})
export class AppModule { }
