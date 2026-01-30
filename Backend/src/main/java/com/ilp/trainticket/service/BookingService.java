
package com.ilp.trainticket.service;

import org.springframework.stereotype.Service;
import com.ilp.trainticket.entity.*;
import com.ilp.trainticket.repository.*;
import com.ilp.trainticket.dto.*;
// import java.time.LocalDate;

@Service
public class BookingService {

 private final ReservationRepository reservationRepo;
 private final PassengerRepository passengerRepo;
 private final TrainRepository trainRepo;

 public BookingService(ReservationRepository r, PassengerRepository p, TrainRepository t) {
  this.reservationRepo = r;
  this.passengerRepo = p;
  this.trainRepo = t;
 }

 public Reservation book(BookingRequest req) {
  Passenger p = passengerRepo.findById(req.passengerId).orElseThrow();
  Train t = trainRepo.findById(req.trainId).orElseThrow();

  Reservation r = new Reservation();
  r.setPassenger(p);
  r.setTrain(t);
  r.setTravelDate(req.travelDate);
  r.setStatus("PENDING");

  return reservationRepo.save(r);
 }
}
