import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeCardsComponent } from './node-cards.component';

describe('NodeCardsComponent', () => {
  let component: NodeCardsComponent;
  let fixture: ComponentFixture<NodeCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeCardsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
