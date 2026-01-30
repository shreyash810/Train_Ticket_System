
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.Passenger;

public interface PassengerRepository extends JpaRepository<Passenger, Long> {
 boolean existsByEmail(String email);
}
