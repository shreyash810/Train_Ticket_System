
package com.ilp.trainticket.service;

import org.springframework.stereotype.Service;
import com.ilp.trainticket.entity.*;
import com.ilp.trainticket.repository.*;
import com.ilp.trainticket.dto.*;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplaintService {

 private final ComplaintRepository repo;
 private final PassengerRepository passengerRepo;

 public ComplaintService(ComplaintRepository r, PassengerRepository p) {
  this.repo = r;
  this.passengerRepo = p;
 }

 public Complaint register(ComplaintRequest req) {
  Passenger p = passengerRepo.findById(req.passengerId).orElseThrow();

  Complaint c = new Complaint();
  c.setPassenger(p);
  c.setCategory(req.category);
  c.setTitle(req.title);
  c.setDescription(req.description);
  c.setStatus("OPEN");
  c.setCreatedAt(LocalDateTime.now());

  return repo.save(c);
 }

 public List<Complaint> myComplaints(Long passengerId) {
  return repo.findByPassengerId(passengerId);
 }
}
