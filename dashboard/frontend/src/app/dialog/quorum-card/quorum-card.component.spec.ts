import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuorumCardComponent } from './quorum-card.component';

describe('QuorumCardComponent', () => {
  let component: QuorumCardComponent;
  let fixture: ComponentFixture<QuorumCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuorumCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuorumCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
