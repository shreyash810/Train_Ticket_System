
package com.ilp.trainticket.service;

import org.springframework.stereotype.Service;
import java.util.List;
import com.ilp.trainticket.entity.*;
import com.ilp.trainticket.repository.*;
import com.ilp.trainticket.dto.*;

@Service
public class AdminService {

    private final TrainRepository trainRepo;
    private final ReservationRepository reservationRepo;
    private final ComplaintRepository complaintRepo;
    private final ComplaintAssignmentRepository assignmentRepo;
    private final StaffRepository staffRepo;

    public AdminService(TrainRepository t, ReservationRepository r, ComplaintRepository c,
                        ComplaintAssignmentRepository a, StaffRepository s) {
        this.trainRepo = t;
        this.reservationRepo = r;
        this.complaintRepo = c;
        this.assignmentRepo = a;
        this.staffRepo = s;
    }

    public Train addTrain(TrainRequest req) {
        Train t = new Train();
        t.setTrainNumber(req.trainNumber);
        t.setTrainName(req.trainName);
        t.setOrigin(req.origin);
        t.setDestination(req.destination);
        t.setTotalSeats(req.totalSeats);
        return trainRepo.save(t);
    }

    public List<Reservation> allReservations() {
        return reservationRepo.findAll();
    }

    public List<Complaint> allComplaints() {
        return complaintRepo.findAll();
    }

    public List<Staff> allStaff() {
        return staffRepo.findAll();
    }

    public ComplaintAssignment assignComplaint(AssignComplaintRequest req) {
        Complaint c = complaintRepo.findById(req.complaintId).orElseThrow();
        Staff s = staffRepo.findById(req.staffId).orElseThrow();

        ComplaintAssignment ca = new ComplaintAssignment();
        ca.setComplaint(c);
        ca.setStaff(s);
        ca.setStatus("IN_PROGRESS");
        ca.setUpdatedAt(java.time.LocalDateTime.now());

        c.setStatus("IN_PROGRESS");
        complaintRepo.save(c);

        return assignmentRepo.save(ca);
    }
}
