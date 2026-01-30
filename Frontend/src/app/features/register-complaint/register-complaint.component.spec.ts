import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComplaintComponent } from './register-complaint.component';

describe('RegisterComplaintComponent', () => {
  let component: RegisterComplaintComponent;
  let fixture: ComponentFixture<RegisterComplaintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComplaintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComplaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
