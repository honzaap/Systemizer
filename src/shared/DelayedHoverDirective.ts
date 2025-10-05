import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, merge, of, Subject } from 'rxjs';
import { delay, map, switchMap, takeUntil } from 'rxjs/operators';

@Directive({
	// tslint:disable-next-line:directive-selector
	selector: '[delayed-hover]',
})
export class DelayedHoverDirective implements OnInit, OnDestroy {
	@Input()
	delay = "1500";

	@Output('delayed-hover') hoverEvent = new EventEmitter<void>();
    private destroy$ = new Subject<void>();

	constructor(private readonly element: ElementRef<HTMLElement>) {}

	ngOnInit() {
		const hide$ = fromEvent(this.element.nativeElement, 'mouseleave').pipe(map(() => false));
		const show$ = fromEvent(this.element.nativeElement, 'mouseenter').pipe(map(() => true));

		merge(hide$, show$)
			.pipe(
				takeUntil(this.destroy$),
				switchMap(isHovering => {
					if (!isHovering) {
						return of(false);
					}
					return of(true).pipe(delay(parseInt(this.delay,10)));
				})
			)
			.subscribe(shouldEmit => {
				if (shouldEmit) {
					this.hoverEvent.emit();
				}
			});
	}

	ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
