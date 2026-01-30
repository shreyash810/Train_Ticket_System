
package com.ilp.trainticket.service;

import org.springframework.stereotype.Service;
import java.util.List;
import com.ilp.trainticket.entity.*;
import com.ilp.trainticket.repository.*;

@Service
public class StaffService {

 private final ComplaintAssignmentRepository assignmentRepo;

 public StaffService(ComplaintAssignmentRepository repo) {
  this.assignmentRepo = repo;
 }

 public List<ComplaintAssignment> myAssignments(Long staffId) {
  return assignmentRepo.findByStaffId(staffId);
 }

 public ComplaintAssignment updateStatus(Long id, String status) {
  ComplaintAssignment ca = assignmentRepo.findById(id).orElseThrow();
  ca.setStatus(status);
  ca.setUpdatedAt(java.time.LocalDateTime.now());
   Complaint c = ca.getComplaint();
   if(c!=null){
    c.setStatus(status);
   }
  return assignmentRepo.save(ca);
 }
}
