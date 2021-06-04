import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { HeaderComponent } from './header/header.component';
import { ClientComponent } from './board/components/client/client.component';
import { ConnectionComponent } from './board/components/connection/connection.component';
import { PortComponent } from './board/components/port/port.component';
import { WebserverComponent } from './board/components/webserver/webserver.component';
import { LoadbalancerComponent } from './board/components/loadbalancer/loadbalancer.component';
import { ComponentmenuComponent } from './componentmenu/componentmenu.component';

import { VueEventModifiersPlugin } from "../shared/vue-event-modifiers.plugin";
import { EVENT_MANAGER_PLUGINS } from "@angular/platform-browser";

import { DelayedHoverDirective } from "../shared/DelayedHoverDirective";
import { OptionsmenuComponent } from './optionsmenu/optionsmenu.component';
import { ApiComponent } from './board/components/api/api.component'

import { MatSelectModule } from "@angular/material/select"
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field"
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApiGatewayComponent } from './board/components/apigateway/apigateway.component';
import { TextfieldComponent } from './board/components/textfield/textfield.component';
import { ResizableTextAreaDirective } from "../shared/resizable-textarea";
import { DatabaseComponent } from './board/components/database/database.component';
import { CacheComponent } from './board/components/cache/cache.component';
import { MessagequeueComponent } from './board/components/messagequeue/messagequeue.component';
import { PubsubComponent } from './board/components/pubsub/pubsub.component';


@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    HeaderComponent,
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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatExpansionModule
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
