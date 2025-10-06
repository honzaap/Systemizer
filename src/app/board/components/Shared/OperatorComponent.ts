// src/app/components/Shared/OperatorComponent.ts
import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, EventEmitter, ViewChild, ViewContainerRef, OnInit } from "@angular/core";
import { PlacingService } from "src/app/placing.service";
import { SelectionService } from "src/app/selection.service";
import { SimulationService } from "src/app/simulation.service";
import { ViewingService } from "src/app/viewing.service";
import { IDataOperator } from "src/interfaces/IDataOperator";
import { EndpointOperator } from "src/models/EndpointOperator";
import { APIType } from "src/models/enums/APIType";
import { BalancingAlgorithm } from "src/models/enums/BalancingAlgorithm";
import { DatabaseType } from "src/models/enums/DatabaseType";
import { gRPCMode } from "src/models/enums/gRPCMode";
import { EndpointActionHTTPMethod, HTTPMethod } from "src/models/enums/HTTPMethod";
import { HTTPStatus } from "src/models/enums/HTTPStatus";
import { LoadBalancerType } from "src/models/enums/LoadBalancerType";
import { Protocol } from "src/models/enums/Protocol";
import { ReplacementPolicy } from "src/models/enums/ReplacementPolicy";
import { WritePolicy } from "src/models/enums/WritePolicy";
import { Options } from "src/models/Options";
import { clone, getFormattedMethod } from "src/shared/ExtensionMethods";
import { PortComponent } from "../port/port.component";
import { SimulationCardComponent } from "./simulation-card/simulation-card.component";
import { TitleComponent } from "./title/title.component";

@Component({ template: '' })
export abstract class OperatorComponent implements AfterViewInit, OnInit {

  hasChanged = new EventEmitter();
  showContextMenu = new EventEmitter();

  board!: HTMLElement;
  comp!: HTMLElement;

  public HTTPMethod: typeof HTTPMethod = HTTPMethod;
  public HTTPMethodKeys = Object.values(HTTPMethod).filter(k => !isNaN(Number(k)));
  public EndpointActionHTTPMethod: typeof EndpointActionHTTPMethod = EndpointActionHTTPMethod;
  public EndpointActionHTTPMethodKeys = Object.values(EndpointActionHTTPMethod).filter(k => !isNaN(Number(k)));
  public Protocol: typeof Protocol = Protocol;
  public ProtocolKeys = Object.values(Protocol).filter(k => !isNaN(Number(k)));
  public APIType: typeof APIType = APIType;
  public APITypeKeys = Object.values(APIType).filter(k => !isNaN(Number(k)));
  public gRPCMode: typeof gRPCMode = gRPCMode;
  public gRPCModeKeys = Object.values(gRPCMode).filter(k => !isNaN(Number(k)));
  public LoadBalancerType: typeof LoadBalancerType = LoadBalancerType;
  public LoadBalancerTypeKeys = Object.values(LoadBalancerType).filter(k => !isNaN(Number(k)));
  public BalancingAlgorithm: typeof BalancingAlgorithm = BalancingAlgorithm;
  public BalancingAlgorithmKeys = Object.values(BalancingAlgorithm).filter(k => !isNaN(Number(k)));
  public DatabaseType: typeof DatabaseType = DatabaseType;
  public DatabaseTypeKeys = Object.values(DatabaseType).filter(k => !isNaN(Number(k)));
  public WritePolicy: typeof WritePolicy = WritePolicy;
  public WritePolicyKeys = Object.values(WritePolicy).filter(k => !isNaN(Number(k)));
  public ReplacementPolicy: typeof ReplacementPolicy = ReplacementPolicy;
  public ReplacementPolicyKeys = Object.values(ReplacementPolicy).filter(k => !isNaN(Number(k)));

  @ViewChild("conn", { read: ViewContainerRef, static: false }) conn!: ViewContainerRef | undefined;
  @ViewChild("anchorRef", { static: false, read: ElementRef }) public anchorRef!: ElementRef | undefined;
  @ViewChild("options", { static: false, read: ElementRef }) public optionsRef!: ElementRef | undefined;
  @ViewChild("actions", { static: false, read: ElementRef }) public actionsRef!: ElementRef | undefined;
  @ViewChild("simulations", { static: false, read: ElementRef }) public simulationsRef!: ElementRef | undefined;

  private LogicComponent!: IDataOperator;
  public inputPortRef!: PortComponent | null;
  public outputPortRef!: PortComponent | null;

  private maxX = 0;
  private maxY = 0;
  public anchorRect: any;
  public isReadOnly = false;
  public beforeOptions!: Options;

  constructor(
    protected placingService: PlacingService,
    protected selectionService: SelectionService,
    protected resolver: ComponentFactoryResolver,
    public cdRef: ChangeDetectorRef,
    private viewingService: ViewingService,
    private simulationService: SimulationService
  ) {}

  private waitForAnchorRef(timeoutMs = 2000): Promise<ElementRef | undefined> {
    return new Promise(resolve => {
      const start = performance.now();
      const check = () => {
        if (this.anchorRef && (this.anchorRef as any).nativeElement) {
          resolve(this.anchorRef);
          return;
        }
        if (performance.now() - start > timeoutMs) {
          resolve(undefined);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  ngAfterViewInit(): void {
    this.Init();
  }

  ngOnInit() {
    Promise.resolve().then(() => {
      try { this.cdRef.detectChanges(); } catch {}
    });
  }

  public handleMousedown(event: Event): void {
    if (this.placingService.isConnecting) return;
    event.preventDefault();
    this.handleClick(event);
    this.placingService.startPlacing();

    if (!this.anchorRef?.nativeElement) {
      console.warn("handleMousedown: anchorRef.nativeElement is not available");
      return;
    }

    this.anchorRect = this.anchorRef.nativeElement.getBoundingClientRect();
    this.maxX = this.placingService.boardWidth;
    this.maxY = this.placingService.boardHeight;

    if (event instanceof MouseEvent) {
      if (event.button !== 0) {
        this.placingService.stopPlacing();
        event.preventDefault();
        if (event.button === 2) {
          this.selectionService.addSelection(this, false);
          this.showContextMenu.emit(event);
        }
        return;
      }
      this.selectionService.prevX = event.clientX;
      this.selectionService.prevY = event.clientY;
      this.board.addEventListener("mousemove", this.handleMousemove);
      window.addEventListener("mouseup", this.handleMouseup);
    } else if (event instanceof TouchEvent) {
      this.selectionService.prevX = event.touches[0].clientX;
      this.selectionService.prevY = event.touches[0].clientY;
      this.board.addEventListener("touchmove", this.handleMousemove);
      window.addEventListener("touchend", this.handleMouseup);
    }
  }

  public handleMousemove = (event: Event): void => {
    this.selectionService.moveComponents(event, this.placingService.boardScale);
  }

  private convertPosition(n: number) { return Math.round(n / 10) * 10; }

  public setPosition(x: number, y: number) {
    if (!this.anchorRect) return;
    this.LogicComponent.options.X = Math.max(Math.min(this.maxX - this.anchorRect.width / this.placingService.boardScale, this.convertPosition(x)), 0);
    this.LogicComponent.options.Y = Math.max(Math.min(this.maxY - this.anchorRect.height / this.placingService.boardScale, this.convertPosition(y)), 0);
    this.cdRef.detectChanges();
  }

  public handleMouseup = (): void => {
    this.placingService.stopPlacing();
    this.board.removeEventListener("mousemove", this.handleMousemove);
    window.removeEventListener("mouseup", this.handleMouseup);
    if (this.beforeOptions.X !== this.LogicComponent.options.X || this.beforeOptions.Y !== this.LogicComponent.options.Y) {
      this.afterChange();
    }
  }

  public handleClick(event: Event) {
    if (event instanceof MouseEvent || event instanceof TouchEvent)
      this.selectionService.addSelection(this, (event as MouseEvent).ctrlKey);
  }

  public getLogicComponent(): IDataOperator { return null as any; }

  public getPortComponent(getOutput = false) {
    if (getOutput && this.outputPortRef != null) return this.outputPortRef.getPortComponent();
    else if (!getOutput && this.inputPortRef != null) return this.inputPortRef.getPortComponent();
    return null;
  }

  public onViewInit: Array<() => void> = [];

  public getOptionsElement(): ElementRef | undefined { return this.optionsRef; }
  public getActionsElement(): ElementRef | undefined { return this.actionsRef; }
  public getSimulationsElement(): ElementRef | undefined { return this.simulationsRef; }

  destroyComponent = () => {}

  changeTitle(title: string){
    this.LogicComponent.options.title = title;
    this.cdRef.detectChanges();
  }

  showStatusCode(code: HTTPStatus){
    if (!this.anchorRef?.nativeElement) {
      console.warn("showStatusCode: anchorRef.nativeElement not available");
      return;
    }
    let span = document.createElement("span");
    span.classList.add("status-code-side");
    let type: string;
    if (code >= 0 && code < 1000) {
      if (code >= 100 && code < 200) type = "info";
      else if (code >= 200 && code < 300) type = "success";
      else if (code >= 300 && code < 400) type = "warning";
      else if (code >= 400 && code < 500) type = "error";
      else type = "error";
      span.innerHTML = `<span class="code ${type}">${code}</span><br/>${HTTPStatus[code]}`;
    } else if (code >= 1000 && code < 2000) {
      if (code == 1200) span.innerHTML = `<span class="code success">HIT</span>`;
      else if (code == 1404) span.innerHTML = `<span class="code error">MISS</span>`;
    }

    try {
      this.anchorRef.nativeElement.appendChild(span);
    } catch (e) {
      return;
    }

    setTimeout(() => {
      try { this.anchorRef.nativeElement.removeChild(span); } catch {}
      this.cdRef.detectChanges();
    }, 1500);

    this.cdRef.detectChanges();
  }

  destroySelf = () => {
    this.LogicComponent.destroy();
    this.destroyComponent();
    this.cdRef.detectChanges();
  }

  setReceiveDataAnimation(){
    if (this.viewingService.isPerformanceMode()) return;
    if (!this.comp.classList.contains("anim")) {
      this.comp.classList.add("anim");
      setTimeout(()=> this.comp.classList.remove("anim"), 500);
    }
  }

  Init(generateTitle: boolean = true): void {
    this.LogicComponent = this.getLogicComponent();
    this.board = document.getElementById("board") as HTMLElement;

    if (!this.anchorRef?.nativeElement) {
      console.warn("Init: anchorRef not present - skipping Init");
      return;
    }

    this.comp = this.anchorRef.nativeElement as HTMLElement;
    this.comp.classList.add("component");

    if ((this.LogicComponent as any)?.fillColor) {
      this.comp.style.backgroundColor = (this.LogicComponent as any).color;
    } else {
      this.comp.classList.add("bordered");
      Array.from(this.comp.getElementsByClassName("img")).forEach(el => (el as HTMLElement).style.backgroundColor = (this.LogicComponent as any).color);
      this.comp.style.border = "2px solid " + (this.LogicComponent as any).color;
    }
    if (this.isReadOnly) this.comp.classList.add("read-only");

    this.anchorRect = this.anchorRef.nativeElement.getBoundingClientRect();
    this.maxX = this.placingService.boardWidth;
    this.maxY = this.placingService.boardHeight;

    try {
      this.LogicComponent.onShowStatusCode((code:HTTPStatus)=> this.showStatusCode(code));
      this.LogicComponent.onReceiveData(() => this.setReceiveDataAnimation());
    } catch (e) {}

    if (this.LogicComponent instanceof EndpointOperator) {
      if (this.simulationService.isFlowSimulationOn) this.LogicComponent.isFlowSimulationOn = true;
      this.LogicComponent.onSimulationStateUpdated(() => this.cdRef.detectChanges());
      this.createSimulationCard();
    }

    this.LogicComponent.onFailedConnect((data) => this.placingService.showSnack(data.message));
    this.beforeOptions = clone((this.LogicComponent as any).options);

    let inputPort = (this.LogicComponent as any)["inputPort"];
    let outputPort = (this.LogicComponent as any)["outputPort"];

    if (!this.conn) { this.cdRef.detectChanges(); return; }
    if (generateTitle) this.generateTitle();
    if (inputPort != null) this.createPort(false);
    if (outputPort != null) this.createPort(true);
    this.onViewInit.forEach(e => e());
    this.cdRef.detectChanges();
  }

  createPort(output = false) {
    let factory  = this.resolver.resolveComponentFactory(PortComponent);
    let ref = this.conn!.createComponent(factory);
    ref.instance.IsOutput = output;
    ref.instance.LogicParent = this.LogicComponent;
    ref.instance.IsReadOnly = this.isReadOnly;
    ref.instance.LogicPort = this.LogicComponent[output ? "outputPort" : "inputPort"];
    ref.instance.destroySelf = () => { ref.destroy(); };
    ref.location.nativeElement.classList.add(output ? "right" : "left");
    if (output) this.outputPortRef = ref.instance; else this.inputPortRef = ref.instance;
    this.cdRef.detectChanges();
  }

  createSimulationCard() {
    let factory  = this.resolver.resolveComponentFactory(SimulationCardComponent);
    let ref = this.conn!.createComponent(factory);
    ref.instance.Model = this.LogicComponent;
    this.cdRef.detectChanges();
  }

  generateTitle() {
    let factory  = this.resolver.resolveComponentFactory(TitleComponent);
    let ref = this.conn!.createComponent(factory);
    ref.instance.Model = this.LogicComponent;
    this.cdRef.detectChanges();
  }

  formatMethod(method: any, isDatabase: boolean) { return getFormattedMethod(method, isDatabase); }

  afterChange = () => {
    this.hasChanged.emit();
    this.beforeOptions = clone((this.LogicComponent as any).options);
  }
}
