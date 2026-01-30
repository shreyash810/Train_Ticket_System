
package com.ilp.trainticket.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Payment {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 private String transactionId;
 private double amount;
 public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getTransactionId() {
    return transactionId;
}

public void setTransactionId(String transactionId) {
    this.transactionId = transactionId;
}

public double getAmount() {
    return amount;
}

public void setAmount(double amount) {
    this.amount = amount;
}

public String getStatus() {
    return status;
}

public void setStatus(String status) {
    this.status = status;
}

public LocalDateTime getPaymentTime() {
    return paymentTime;
}

public void setPaymentTime(LocalDateTime paymentTime) {
    this.paymentTime = paymentTime;
}

public Reservation getReservation() {
    return reservation;
}

public void setReservation(Reservation reservation) {
    this.reservation = reservation;
}

private String status;
 private LocalDateTime paymentTime;

 @OneToOne
 private Reservation reservation;
}
