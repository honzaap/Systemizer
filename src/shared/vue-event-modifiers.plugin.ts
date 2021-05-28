// Import the core angular services.
import { Component } from "@angular/core";
 
// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //
 
type EventTarget = Window | Document | HTMLElement;
 
interface EventConfig {
	name: string;
	isStop: boolean;
	isPrevent: boolean;
	isCapture: boolean;
	isSelf: boolean;
	isOnce: boolean;
	isPassive: boolean;
}
 
// I provide support for DOM event-modifiers that are inspired by Vue.js. These allow
// for events to be qualified with the following suffixes:
// --
// - .stop
// - .prevent
// - .capture
// - .self
// - .once
// - .passive
// --
export class VueEventModifiersPlugin {
 
	private supportsPassive: boolean;
 
	// I initialize the event plug-in.
	constructor() {
 
		this.supportsPassive = this.detectPassiveSupport();
 
	}
 
	// ---
	// PUBLIC METHODS.
	// ---
 
	// I bind the given event handler to the given element. Returns a function that
	// tears-down the event binding.
	public addEventListener(
		element: HTMLElement,
		higherOrderEventName: string,
		handler: Function
		) : Function {
 
		var eventConfig = this.parseHigherOrderEventName( higherOrderEventName );
 
		return( this.setupEventBinding( element, eventConfig, handler ) );
 
	}
 
 
	// I bind the given event handler to the given global element selector. Returns a
	// function that tears-down the event binding.
	public addGlobalEventListener(
		higherOrderElement: string,
		higherOrderEventName: string,
		handler: Function
		) : Function {
 
		var target = this.parseHigherOrderElement( higherOrderElement );
		var eventConfig = this.parseHigherOrderEventName( higherOrderEventName );
 
		return( this.setupEventBinding( target, eventConfig, handler ) );
 
	}
 
 
	// I determine if the given event name is supported by this plug-in. For each event
	// binding, the plug-ins are tested in the reverse order of the EVENT_MANAGER_PLUGINS
	// multi-collection. Angular will use the first plug-in that supports the event.
	public supports( eventName: string ) : boolean {
 
		var eventPattern = /^[a-z]+(?:\.(?:stop|prevent|capture|self|once|passive))+$/;
 
		return( eventPattern.test( eventName ) );
 
	}
 
	// ---
	// PRIVATE METHODS.
	// ---
 
	// I determine if the current environment supports Passive event handlers.
	private detectPassiveSupport() : boolean {
 
		var support = false;
 
		// This approach is more-or-less taken from the Mozilla Developer Network:
		// --
		// READ MORE: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
		try {
 
			var handler = function(){};
 
			var options: any = {
				get passive() {
 
					return( support = true );
 
				}
			};
 
			window.addEventListener( "test", handler, options );
			window.removeEventListener( "test", handler, options );
 
		} catch( error ) {
 
			// ...
 
		}
 
		return( support );
 
	}
 
 
	// I parse the "higher order" element selector into an actual browser DOM reference.
	private parseHigherOrderElement( selector: string ) : EventTarget {
 
		switch( selector ) {
			case "window":
				return( window );
			break;
			case "document":
				return( document );
			break;
			case "body":
				return( document.body );
			break;
			default:
				throw( new Error( `Element selector [${ selector }] not supported.` ) );
			break;
		}
 
	}
 
 
	// I parse the "higher order" event name into the event configuration that will be
	// used to bind the underlying event handler.
	private parseHigherOrderEventName( eventName: string ) : EventConfig {
 
		var parts = eventName.split( "." );
 
		var config = {
			name: <string>parts.shift(), // Telling TypeScript not to worry.
			isStop: false,
			isPrevent: false,
			isCapture: false,
			isSelf: false,
			isOnce: false,
			isPassive: false
		};
 
		// While this is different in Vue.js, we're not going to care about the order in
		// which the event modifiers are defined. Each modifier will just act as an
		// independent flag to be consumed when configuring the subsequent event-handler.
		while ( parts.length ) {
 
			switch ( parts.shift() ) {
				case "stop":
					config.isStop = true;
				break;
				case "prevent":
					config.isPrevent = true;
				break;
				case "capture":
					config.isCapture = true;
				break;
				case "self":
					config.isSelf = true;
				break;
				case "once":
					config.isOnce = true;
				break;
				case "passive":
					config.isPassive = true;
				break;
				default:
					throw( new Error( `Event config [${ eventName }] not supported.` ) );
				break;
			}
 
		}
 
		return( config );
 
	}
 
 
	// I bind the given event handler to the given event target using the given event
	// configuration. I can be used for both local and global targets. Returns a function
	// that tears-down the event binding.
	private setupEventBinding(
		target: EventTarget,
		eventConfig: EventConfig,
		handler: Function
		) : Function {
 
		var options: any = eventConfig.isCapture;
		// If the event requires a "passive" modifier, then we have to change the way
		// that we define the event-phase. Passive mode requires an EventListerOptions
		// object that is only supported in some browsers.
		if ( this.supportsPassive && eventConfig.isPassive ) {
 
			options = {
				passive: true,
				capture: eventConfig.isCapture
			};
 
		}
 
		// NOTE: We are remaining inside the Angular Zone (if it is loaded).
		addProxyFunction();
 
		return( removeProxyFunction );
 
		// -- Hoisted Functions -- //
 
		function addProxyFunction() {
 
			target.addEventListener( eventConfig.name, proxyFunction, options );
 
		}
 
		function removeProxyFunction() {
 
			target.removeEventListener( eventConfig.name, proxyFunction, options );
 
		}
 
		function proxyFunction( event: Event ) {
 
			// NOTE: If the target is not Self, the handler won't be called. But, a
			// change-digest will still be triggered. This is because we're not bothering
			// to bind the handler outside of the Angular Zone (since most cases will be
			// a one-to-one mapping of event-to-handler invocation).
			if ( eventConfig.isSelf && ( event.target !== target ) ) {
 
				return;
 
			}
 
			// If the handler is only intended to be invoked once, let's unbind before
			// we call the underlying handler.
			if ( eventConfig.isOnce ) {
 
				removeProxyFunction();
 
			}
 
			if ( eventConfig.isStop ) {
 
				event.stopPropagation();
 
			}
 
			if ( eventConfig.isPrevent ) {
 
				event.preventDefault();
 
			}
 
			handler( event );
 
		}
 
	}
 
}