
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.Complaint;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
 List<Complaint> findByPassengerId(Long passengerId);
}
