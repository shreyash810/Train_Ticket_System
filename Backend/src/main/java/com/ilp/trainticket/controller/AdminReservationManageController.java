
package com.ilp.trainticket.controller;

import com.ilp.trainticket.dto.ReservationAdminDto;
import com.ilp.trainticket.dto.UpdateStatusRequest;
import com.ilp.trainticket.entity.Reservation;
import com.ilp.trainticket.exception.ApiException;
import com.ilp.trainticket.repository.ReservationRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationManageController {

    private final ReservationRepository reservationRepo;

    public AdminReservationManageController(ReservationRepository reservationRepo) {
        this.reservationRepo = reservationRepo;
    }

    private ReservationAdminDto toDto(Reservation r) {
        return new ReservationAdminDto(
                r.getId(),
                (r.getPassenger() != null ? r.getPassenger().getName() : "Passenger"),
                (r.getTrain() != null ? r.getTrain().getTrainNumber() : ""),
                (r.getTrain() != null ? r.getTrain().getTrainName() : ""),
                (r.getTrain() != null ? r.getTrain().getOrigin() : ""),
                (r.getTrain() != null ? r.getTrain().getDestination() : ""),
                r.getTravelDate(),
                r.getStatus()
        );
    }

    private String canonicalizeAdminStatus(String incoming) {
        if (incoming == null) return null;
        String s = incoming.trim().toUpperCase();
        return switch (s) {
            case "CONFIRMED" -> "Confirmed";
            case "PENDING"   -> "Pending";
            case "CANCELLED", "CANCELED" -> "Cancelled";
            default -> null;
        };
    }

    @PutMapping("/{id}/status")
    public ReservationAdminDto updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest req) {
        Reservation r = reservationRepo.findById(id)
                .orElseThrow(() -> new ApiException("Reservation not found"));

        String canon = canonicalizeAdminStatus(req.status());
        if (canon == null || "Cancelled".equals(canon)) {
            throw new ApiException("Invalid status. Allowed: Confirmed, Pending");
        }
        r.setStatus(canon);
        return toDto(reservationRepo.save(r));
    }

    @PostMapping("/{id}/cancel")
    public ReservationAdminDto cancel(@PathVariable Long id) {
        Reservation r = reservationRepo.findById(id)
                .orElseThrow(() -> new ApiException("Reservation not found"));

        if (!"Cancelled".equalsIgnoreCase(r.getStatus())) {
            r.setStatus("Cancelled");
            r = reservationRepo.save(r);
        }
        return toDto(r);
    }
}
