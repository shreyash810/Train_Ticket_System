
package com.ilp.trainticket.controller;

import com.ilp.trainticket.dto.ReservationAdminDto;
import com.ilp.trainticket.entity.Reservation;
import com.ilp.trainticket.entity.Passenger;
import com.ilp.trainticket.entity.Train;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationSearchController {

    private final EntityManager em;

    public AdminReservationSearchController(EntityManager em) {
        this.em = em;
    }

    @GetMapping("/search")
    public List<ReservationAdminDto> search(
            @RequestParam(required = false) String reservationId,
            @RequestParam(required = false) String passengerName,
            @RequestParam(required = false) String trainNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reservationDate
    ) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Reservation> cq = cb.createQuery(Reservation.class);
        Root<Reservation> root = cq.from(Reservation.class);
        Join<Reservation, Passenger> p = root.join("passenger");
        Join<Reservation, Train> t = root.join("train");

        List<Predicate> preds = new ArrayList<>();

        if (reservationId != null && !reservationId.isBlank()) {
            String like = "%" + reservationId.trim() + "%";
            preds.add(cb.like(cb.toString(root.get("id")), like));
        }
        if (passengerName != null && !passengerName.isBlank()) {
            preds.add(cb.like(cb.lower(p.get("name")), "%" + passengerName.trim().toLowerCase() + "%"));
        }
        if (trainNumber != null && !trainNumber.isBlank()) {
            preds.add(cb.equal(t.get("trainNumber"), trainNumber.trim()));
        }
        if (status != null && !status.isBlank()) {
            preds.add(cb.equal(cb.lower(root.get("status")), status.trim().toLowerCase()));
        }
        if (reservationDate != null) {
            preds.add(cb.equal(root.get("travelDate"), reservationDate));
        }

        cq.where(preds.toArray(new Predicate[0]));
        cq.orderBy(cb.desc(root.get("id")));

        List<Reservation> rows = em.createQuery(cq).getResultList();

        return rows.stream().map(r -> new ReservationAdminDto(
                r.getId(),
                r.getPassenger() != null ? r.getPassenger().getName() : "Passenger",
                r.getTrain() != null ? r.getTrain().getTrainNumber() : "",
                r.getTrain() != null ? r.getTrain().getTrainName() : "",
                r.getTrain() != null ? r.getTrain().getOrigin() : "",
                r.getTrain() != null ? r.getTrain().getDestination() : "",
                r.getTravelDate(),
                r.getStatus()
        )).toList();
    }
}
