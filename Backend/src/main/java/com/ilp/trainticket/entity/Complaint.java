
package com.ilp.trainticket.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Complaint {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;
 private String category;
 private String title;
 private String description;
 private String status;
 private LocalDateTime createdAt;

 @JsonIgnore
 @ManyToOne
 private Passenger passenger;
 public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getCategory() {
    return category;
}

public void setCategory(String category) {
    this.category = category;
}

public String getTitle() {
    return title;
}

public void setTitle(String title) {
    this.title = title;
}

public String getDescription() {
    return description;
}

public void setDescription(String description) {
    this.description = description;
}

public String getStatus() {
    return status;
}

public void setStatus(String status) {
    this.status = status;
}

public LocalDateTime getCreatedAt() {
    return createdAt;
}

public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
}

public Passenger getPassenger() {
    return passenger;
}

public void setPassenger(Passenger passenger) {
    this.passenger = passenger;
}


}
