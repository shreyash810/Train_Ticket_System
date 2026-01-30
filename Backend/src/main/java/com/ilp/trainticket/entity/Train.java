
package com.ilp.trainticket.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "trains")
public class Train {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 private String trainNumber;
 private String trainName;
 private String origin;
 private String destination;
 private int totalSeats;
public Long getId() {
    return id;
}
public Train(){}
public Train(String trainNumber, String trainName, String origin, String destination, int totalSeats) {
    this.trainNumber = trainNumber;
    this.trainName = trainName;
    this.origin = origin;
    this.destination = destination;
    this.totalSeats = totalSeats;
}
public void setId(Long id) {
    this.id = id;
}
public String getTrainNumber() {
    return trainNumber;
}
public void setTrainNumber(String trainNumber) {
    this.trainNumber = trainNumber;
}
public String getTrainName() {
    return trainName;
}
public void setTrainName(String trainName) {
    this.trainName = trainName;
}
public String getOrigin() {
    return origin;
}
public void setOrigin(String origin) {
    this.origin = origin;
}
public String getDestination() {
    return destination;
}
public void setDestination(String destination) {
    this.destination = destination;
}
public int getTotalSeats() {
    return totalSeats;
}
public void setTotalSeats(int totalSeats) {
    this.totalSeats = totalSeats;
}
}
