import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { fromEvent, merge, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';

@Directive({
	// tslint:disable-next-line:directive-selector
	selector: '[delayed-hover]',
})
export class DelayedHoverDirective implements OnInit, OnDestroy {
	@Input()
	delay = "1500";

	@Output('delayed-hover') hoverEvent = new EventEmitter();

	constructor(private readonly element: ElementRef) {}

	ngOnInit() {
		const hide$ = fromEvent(this.element.nativeElement, 'mouseleave').pipe(map(_ => false));
		const show$ = fromEvent(this.element.nativeElement, 'mouseenter').pipe(map(_ => true));

		merge(hide$, show$)
			.pipe(
				untilDestroyed(this),
				switchMap(show => {
					if (!show) {
						return of(false);
					}
					return of(true).pipe(delay(parseInt(this.delay)));
				})
			)
			.subscribe(show => {
				if (show) {
					this.hoverEvent.emit();
				}
			});
	}

	ngOnDestroy() {}
}