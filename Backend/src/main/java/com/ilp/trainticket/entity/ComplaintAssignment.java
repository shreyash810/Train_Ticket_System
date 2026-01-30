
package com.ilp.trainticket.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class ComplaintAssignment {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 @JsonIgnore
 @ManyToOne
 private Complaint complaint;

 @ManyToOne
 private Staff staff;

 private String status;
 private LocalDateTime updatedAt;
public Long getId() {
    return id;
}
public void setId(Long id) {
    this.id = id;
}
public Complaint getComplaint() {
    return complaint;
}
public void setComplaint(Complaint complaint) {
    this.complaint = complaint;
}
public Staff getStaff() {
    return staff;
}
public void setStaff(Staff staff) {
    this.staff = staff;
}
public String getStatus() {
    return status;
}
public void setStatus(String status) {
    this.status = status;
}
public LocalDateTime getUpdatedAt() {
    return updatedAt;
}
public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
}
}
