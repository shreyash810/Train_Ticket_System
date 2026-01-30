
package com.ilp.trainticket.dto;

import java.time.LocalDate;

public record ReservationAdminDto(
        Long id,
        String passengerName,
        String trainNumber,
        String trainName,
        String source,
        String destination,
        LocalDate travelDate,
        String status
) {}
