
package com.ilp.trainticket.controller;

import com.ilp.trainticket.entity.Reservation;
import com.ilp.trainticket.repository.ReservationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/booking")
public class BookingQueryController {

    private final ReservationRepository reservationRepository;

    public BookingQueryController(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @GetMapping("/user/{passengerId}")
    public List<Reservation> getByPassenger(@PathVariable Long passengerId) {
        return reservationRepository.findByPassengerId(passengerId);
    }

    @DeleteMapping("/{reservationId}")
    public void cancel(@PathVariable Long reservationId) {
        // Simple delete for now (no schema change). Later you can update status to CANCELLED instead.
        reservationRepository.deleteById(reservationId);
    }
}
