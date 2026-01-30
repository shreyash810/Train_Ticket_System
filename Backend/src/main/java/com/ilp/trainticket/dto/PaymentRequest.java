
package com.ilp.trainticket.dto;

public record PaymentRequest(
        Long reservationId,
        String transactionId,
        double amount,
        String status   // e.g., "PAID"
) {}
