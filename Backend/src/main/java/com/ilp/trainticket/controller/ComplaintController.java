
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.ilp.trainticket.service.ComplaintService;
import com.ilp.trainticket.dto.ComplaintRequest;
import com.ilp.trainticket.entity.Complaint;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

 private final ComplaintService service;

 public ComplaintController(ComplaintService service) {
  this.service = service;
 }

 @PostMapping
 public Complaint register(@RequestBody ComplaintRequest r) {
  return service.register(r);
 }

 @GetMapping("/{passengerId}")
 public List<Complaint> list(@PathVariable Long passengerId) {
  return service.myComplaints(passengerId);
 }
}
