
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.ilp.trainticket.service.StaffService;
import com.ilp.trainticket.entity.ComplaintAssignment;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

 private final StaffService service;

 public StaffController(StaffService service) {
  this.service = service;
 }

 @GetMapping("/assignments/{staffId}")
 public List<ComplaintAssignment> my(@PathVariable Long staffId) {
  return service.myAssignments(staffId);
 }

 @PutMapping("/assignment/{id}")
 public ComplaintAssignment update(@PathVariable Long id, @RequestParam String status) {
  return service.updateStatus(id, status);
 }
}
