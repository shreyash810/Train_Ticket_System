
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.Payment;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // reservation.passenger.id → Spring Data derives nested path
    List<Payment> findByReservation_Passenger_IdOrderByPaymentTimeDesc(Long passengerId);
}