
package com.ilp.trainticket.service;

import com.ilp.trainticket.dto.PaymentRequest;
import com.ilp.trainticket.dto.PaymentDto;
import com.ilp.trainticket.entity.Payment;
import com.ilp.trainticket.entity.Reservation;
import com.ilp.trainticket.exception.ApiException;
import com.ilp.trainticket.repository.PaymentRepository;
import com.ilp.trainticket.repository.ReservationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final ReservationRepository reservationRepo;

    public PaymentService(PaymentRepository paymentRepo, ReservationRepository reservationRepo) {
        this.paymentRepo = paymentRepo;
        this.reservationRepo = reservationRepo;
    }

    public Payment recordPayment(PaymentRequest req) {
        Reservation r = reservationRepo.findById(req.reservationId())
                .orElseThrow(() -> new ApiException("Reservation not found"));

        Payment p = new Payment();
        p.setReservation(r);
        p.setTransactionId(req.transactionId());
        p.setAmount(req.amount());
        p.setStatus(req.status());
        p.setPaymentTime(LocalDateTime.now());
        return paymentRepo.save(p);
    }

    public List<PaymentDto> listByPassenger(Long passengerId) {
        return paymentRepo.findByReservation_Passenger_IdOrderByPaymentTimeDesc(passengerId)
                .stream()
                .map(p -> new PaymentDto(
                        p.getId(),
                        p.getTransactionId(),
                        p.getAmount(),
                        p.getStatus(),
                        p.getPaymentTime(),
                        p.getReservation() != null ? p.getReservation().getId() : null
                ))
                .toList();
    }
}
