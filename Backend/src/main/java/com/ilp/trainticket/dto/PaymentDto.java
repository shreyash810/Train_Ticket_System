
package com.ilp.trainticket.dto;

import java.time.LocalDateTime;

public record PaymentDto(
        Long id,
        String transactionId,
        double amount,
        String status,
        LocalDateTime paymentTime,
        Long reservationId
) {}
