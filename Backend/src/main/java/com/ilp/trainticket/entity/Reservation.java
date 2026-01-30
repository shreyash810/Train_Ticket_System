
package com.ilp.trainticket.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "reservations")
public class Reservation {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 public Long getId() {
    return id;
}
public void setId(Long id) {
    this.id = id;
}
public Passenger getPassenger() {
    return passenger;
}
public void setPassenger(Passenger passenger) {
    this.passenger = passenger;
}
public Train getTrain() {
    return train;
}
public void setTrain(Train train) {
    this.train = train;
}
public LocalDate getTravelDate() {
    return travelDate;
}
public void setTravelDate(LocalDate travelDate) {
    this.travelDate = travelDate;
}
public String getStatus() {
    return status;
}
public void setStatus(String status) {
    this.status = status;
}
@JsonIgnore
@ManyToOne
 private Passenger passenger;

 @ManyToOne
 private Train train;

 private LocalDate travelDate;
 private String status;
}
