
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import com.ilp.trainticket.service.BookingService;
import com.ilp.trainticket.dto.BookingRequest;
import com.ilp.trainticket.entity.Reservation;

@RestController
@RequestMapping("/api/booking")
public class BookingController {

 private final BookingService service;

 public BookingController(BookingService service) {
  this.service = service;
 }

 @PostMapping
 public Reservation book(@RequestBody BookingRequest r) {
  return service.book(r);
 }
}
