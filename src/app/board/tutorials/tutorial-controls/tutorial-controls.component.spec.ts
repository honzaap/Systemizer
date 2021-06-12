import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialControlsComponent } from './tutorial-controls.component';

describe('TutorialControlsComponent', () => {
  let component: TutorialControlsComponent;
  let fixture: ComponentFixture<TutorialControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialControlsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
