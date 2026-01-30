
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.Reservation;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByPassengerId(Long passengerId);
}
