import { TestBed } from '@angular/core/testing';

import { SeatInventoryService } from './seat-inventory.service';

describe('SeatInventoryService', () => {
  let service: SeatInventoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeatInventoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
