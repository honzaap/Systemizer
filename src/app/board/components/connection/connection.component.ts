import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SelectionService } from 'src/app/selection.service';
import { Connection, LineBreak } from 'src/models/Connection';
import { PortComponent } from '../port/port.component';

@Component({
	selector: 'connection',
	templateUrl: './connection.component.html',
	styleUrls: ['./connection.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionComponent implements OnInit {
  
	public portComponent1 : PortComponent;
	public portComponent2 : PortComponent;
	
	public LogicConnection : Connection;

	isReadOnly = false;
	line: string = "";

	@ViewChild("svg") svg: ElementRef;
	@ViewChild("mainPath") mainPath: ElementRef;
	@ViewChild("secondPath") secondPath: ElementRef;
	@ViewChild("data") data: ElementRef;
	@ViewChild("dataAnim") dataAnim: ElementRef;

	lineCurrX: number = 0;
	lineCurrY: number = 0;
	linePrevX: number = 0;
	linePrevY: number = 0;

	constructor(public elem: ElementRef, private cdRef: ChangeDetectorRef, public selectionService: SelectionService){
	}

	ngOnInit(): void {
		if(this.LogicConnection.lineBreaks == null || this.LogicConnection.lineBreaks.length === 0){
			this.LogicConnection.lineBreaks = [
				new LineBreak((this.portComponent1.port.nativeElement.offsetLeft+this.portComponent1.port.nativeElement.clientWidth/2),(this.portComponent1.port.nativeElement.offsetTop+this.portComponent1.port.nativeElement.clientHeight/2)),
				new LineBreak((this.portComponent2.port.nativeElement.offsetLeft+this.portComponent2.port.nativeElement.clientWidth/2),(this.portComponent2.port.nativeElement.offsetTop+this.portComponent2.port.nativeElement.clientHeight/2))
			]
		}
		this.portComponent1.LogicPort.onRemoveConnection((conn) => {
			if(conn === this.LogicConnection){
				this.destroyComponent();
			}
		});

		this.portComponent2.LogicPort.onRemoveConnection((conn) => {
			if(conn === this.LogicConnection){
				this.destroyComponent();
			}    
		});

		this.LogicConnection.onSendData((port)=>{
			let dataSvg = document.createElementNS('http://www.w3.org/2000/svg','circle');
			dataSvg.style.display = "none"
			this.svg.nativeElement.appendChild(dataSvg);
			let anim = document.createElementNS('http://www.w3.org/2000/svg','animateMotion');
			let delay = Math.max(this.mainPath.nativeElement.getTotalLength(), 0.18);

			anim.setAttribute("attributeName", "cx");

			anim.setAttribute("dur", `${delay+20}ms`);

			anim.setAttribute("begin", "0");

			anim.setAttribute("rotate", "auto");

			anim.setAttribute("calcMode", "linear");

			anim.setAttribute("rotate", "auto");

			anim.setAttribute("path", this.line);

			dataSvg.setAttribute("r","5")
			dataSvg.setAttribute("fill","#31B78D")

			if(port !== this.portComponent1.LogicPort){
				anim.setAttribute("keyPoints", "1;0");
				anim.setAttribute("keyTimes", "0;1");
			}

			dataSvg.appendChild(anim);

			(anim as any).beginElement();
			dataSvg.style.display = "block"
			setTimeout(()=>{
				dataSvg.remove();
			},delay)

			this.LogicConnection.getSendDataDelay = () => {return delay}
		})
	}

	handleClick(){
		this.selectionService.setConnectionSelection(this);
	}

	destroySelf = () => {
		this.LogicConnection.destroy();
		this.destroyComponent();
	}

	destroyComponent = () => {}

	ngAfterViewChecked(){
		this.cdRef.detectChanges();
		this.LogicConnection.lineBreaks[0] = 
			new LineBreak((this.portComponent1.port.nativeElement.offsetLeft+this.portComponent1.port.nativeElement.clientWidth/2),(this.portComponent1.port.nativeElement.offsetTop+this.portComponent1.port.nativeElement.clientHeight/2)),
		this.LogicConnection.lineBreaks[this.LogicConnection.lineBreaks.length-1] =
			new LineBreak((this.portComponent2.port.nativeElement.offsetLeft+this.portComponent2.port.nativeElement.clientWidth/2),(this.portComponent2.port.nativeElement.offsetTop+this.portComponent2.port.nativeElement.clientHeight/2))
		
		this.line = 'M'+this.LogicConnection.lineBreaks[0].x + ' ' + this.LogicConnection.lineBreaks[0].y
		+ this.LogicConnection.lineBreaks.map(b => [b.x,b.y]).map(b => ' L'+b.toString().replace(/,/g, " ")).toString().replace(/,/g, " ");
	}

	breakLine(previous: LineBreak, next: LineBreak, event: MouseEvent){
		let line = new LineBreak(
			(previous.x + next.x)/2,
			(previous.y + next.y)/2);
		let index = this.LogicConnection.lineBreaks.findIndex(br => br.x === previous.x && br.y === previous.y);
		if(index == -1){
			return;
		}
		this.LogicConnection.lineBreaks.splice(index + 1, 0, line);
		this.moveLine(line, event);
	}

	moveLine(line: LineBreak, event: MouseEvent){
		this.selectionService.setLineBreakSelection(line, this.LogicConnection.lineBreaks);
		let index = this.LogicConnection.lineBreaks.findIndex(br => br.x === line.x && br.y === line.y);
		let prev = this.LogicConnection.lineBreaks[index-1];
		let next = this.LogicConnection.lineBreaks[index+1];
		let board = document.getElementById("board");
		this.lineCurrX = line.x;
		this.lineCurrY = line.y;
		this.linePrevX = event.clientX;
		this.linePrevY = event.clientY;

		board.onmousemove = (e: MouseEvent) => {
			this.lineCurrX = this.lineCurrX - (this.linePrevX - e.clientX) / this.portComponent1.placingService.boardScale;
			this.lineCurrY = this.lineCurrY - (this.linePrevY - e.clientY) / this.portComponent1.placingService.boardScale;

			// Snapping to next line break
			let deltaXNext = this.lineCurrX - next.x;
			let deltaYNext = this.lineCurrY - next.y;
			let angleNext = Math.atan2(deltaYNext, deltaXNext) * (180/Math.PI); 

			let degreesLeftNext = Math.min(Math.abs(angleNext) - 90, Math.abs(angleNext) - 180) % 90;
			degreesLeftNext = Math.min(Math.abs(degreesLeftNext), 90 - Math.abs(degreesLeftNext))

			// Snapping to previous line break
			let deltaXPrev = prev.x - this.lineCurrX;
			let deltaYPrev = prev.y - this.lineCurrY;
			let anglePrev = Math.atan2(deltaYPrev, deltaXPrev) * (180/Math.PI); 

			let degreesLeftPrev = Math.min(Math.abs(anglePrev) - 90, Math.abs(anglePrev) - 180) % 90;
			degreesLeftPrev = Math.min(Math.abs(degreesLeftPrev), 90 - Math.abs(degreesLeftPrev))

			let moveX = true;
			let moveY = true;

			const SNAP_ANGLE = 10;

			let diffNextX = Math.abs(this.lineCurrX - next.x);
			let diffNextY = Math.abs(this.lineCurrY - next.y);
			let diffPrevX = Math.abs(this.lineCurrX - prev.x);
			let diffPrevY = Math.abs(this.lineCurrY - prev.y);
			if(diffNextY < SNAP_ANGLE){
				line.y = next.y;
				moveY = false
			}
			else if(diffNextX < SNAP_ANGLE){
				line.x = next.x;
				moveX = false;
			}
			if(diffPrevY < SNAP_ANGLE){
				line.y = prev.y;
				moveY = false;
			}
			else if(diffPrevX < SNAP_ANGLE){
				line.x = prev.x;
				moveX = false;
			}
			if(moveX)
				line.x = this.lineCurrX;
			if(moveY)
				line.y = this.lineCurrY;

			this.linePrevX = e.clientX;
			this.linePrevY = e.clientY;
		}
		window.onmouseup = () => {
			board.onmousemove = null;
			window.onmouseup = null;
		}
	}
}
