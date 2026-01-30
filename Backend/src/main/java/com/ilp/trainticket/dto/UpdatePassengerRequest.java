
package com.ilp.trainticket.dto;

public record UpdatePassengerRequest(
        String name,
        String mobile,
        String address
) {}
