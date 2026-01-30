
package com.ilp.trainticket.dto;

/**
 * Request body for updating a reservation's status.
 * Allowed values (case-insensitive): "Confirmed", "Pending"
 * Note: "Cancelled" is handled by the cancel endpoint.
 */
public record UpdateStatusRequest(String status) {}
