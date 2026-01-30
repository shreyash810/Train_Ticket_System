
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.Train;

public interface TrainRepository extends JpaRepository<Train, Long> {}
