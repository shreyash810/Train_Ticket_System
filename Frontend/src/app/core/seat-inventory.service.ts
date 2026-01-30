
import { Injectable } from '@angular/core';

export interface Seat {
  seatId: string;      // e.g., S1-01
  coach: string;       // e.g., S1
  row: number;         // sequential index
  occupied: boolean;
}

interface Inventory {
  key: string;         // trainNo|date|class
  seats: Seat[];
}

@Injectable({ providedIn: 'root' })
export class SeatInventoryService {
  private LS_KEY = 'railInSeatInventory';

  private keyOf(trainNo: string, date: string, clazz: string) {
    return `${trainNo}|${date}|${clazz}`;
  }

  private getAll(): Inventory[] {
    const raw = localStorage.getItem(this.LS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as Inventory[]; } catch {
      localStorage.removeItem(this.LS_KEY);
      return [];
    }
  }

  private setAll(list: Inventory[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  /** Get or init seat map for (train, date, class). */
  getOrInit(trainNo: string, date: string, clazz: string, coachCount: number, totalSeats: number): Inventory {
    const key = this.keyOf(trainNo, date, clazz);
    const list = this.getAll();
    let inv = list.find(i => i.key === key);
    if (inv) return inv;

    const seats: Seat[] = [];
    const perCoach = Math.floor(totalSeats / coachCount);
    let remainder = totalSeats % coachCount;

    for (let c = 1; c <= coachCount; c++) {
      const coachLabel = `${clazz.charAt(0)}${c}`; // e.g., 'A1','S1','G1'
      const count = perCoach + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);

      for (let i = 1; i <= count; i++) {
        seats.push({
          seatId: `${coachLabel}-${String(i).padStart(2, '0')}`,
          coach: coachLabel,
          row: i,
          occupied: false
        });
      }
    }

    inv = { key, seats };
    this.setAll([...list, inv]);
    return inv;
  }

  availableCount(trainNo: string, date: string, clazz: string): number {
    const inv = this.getAll().find(i => i.key === this.keyOf(trainNo, date, clazz));
    return inv ? inv.seats.filter(s => !s.occupied).length : 0;
    // If undefined, caller should init via getOrInit() first
  }

  /** Allocate seats contiguously in a coach where possible; else best across class. */
  allocate(trainNo: string, date: string, clazz: string, count: number): string[] | null {
    const key = this.keyOf(trainNo, date, clazz);
    const list = this.getAll();
    const inv = list.find(i => i.key === key);
    if (!inv) return null;

    const free = inv.seats.filter(s => !s.occupied);
    if (free.length < count) return null;

    // Try contiguous block per coach
    const byCoach = new Map<string, Seat[]>();
    for (const s of free) {
      const arr = byCoach.get(s.coach) || [];
      arr.push(s);
      byCoach.set(s.coach, arr);
    }
    for (const [coach, seats] of byCoach.entries()) {
      seats.sort((a, b) => a.row - b.row);
      for (let i = 0; i <= seats.length - count; i++) {
        const block = seats.slice(i, i + count);
        let contiguous = true;
        for (let k = 1; k < block.length; k++) {
          if (block[k].row !== block[k - 1].row + 1) { contiguous = false; break; }
        }
        if (contiguous) {
          for (const s of block) s.occupied = true;
          this.setAll(list);
          return block.map(s => s.seatId);
        }
      }
    }

    // Fallback: pick best across all (coach, row)
    const best = free.sort((a, b) => a.coach.localeCompare(b.coach) || a.row - b.row).slice(0, count);
    for (const s of best) s.occupied = true;
    this.setAll(list);
    return best.map(s => s.seatId);
  }

  /** Release seats (used on cancellation) */
  release(trainNo: string, date: string, clazz: string, seatIds: string[]) {
    const key = this.keyOf(trainNo, date, clazz);
    const list = this.getAll();
    const inv = list.find(i => i.key === key);
    if (!inv) return;
    for (const id of seatIds) {
      const s = inv.seats.find(seat => seat.seatId === id);
      if (s) s.occupied = false;
    }
    this.setAll(list);
  }
}
