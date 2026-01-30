
package com.ilp.trainticket.dto;

import java.time.LocalDate;

public record PassengerDto(
        Long id,
        String name,
        String email,
        String mobile,
        String address,
        LocalDate dob
) {}
