
package com.ilp.trainticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ilp.trainticket.entity.ComplaintAssignment;
import java.util.List;

public interface ComplaintAssignmentRepository extends JpaRepository<ComplaintAssignment, Long> {
 List<ComplaintAssignment> findByStaffId(Long staffId);
}
