
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.ilp.trainticket.service.AdminService;
import com.ilp.trainticket.dto.*;
import com.ilp.trainticket.entity.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @PostMapping("/train")
    public Train addTrain(@RequestBody TrainRequest r) {
        return service.addTrain(r);
    }

    @GetMapping("/reservations")
    public List<Reservation> reservations() {
        return service.allReservations();
    }

    @PostMapping("/assign-complaint")
    public ComplaintAssignment assign(@RequestBody AssignComplaintRequest r) {
        return service.assignComplaint(r);
    }

    // === NEW: List all complaints for Admin dashboard ===
    @GetMapping("/complaints")
    public List<Complaint> allComplaints() {
        return service.allComplaints();
    }

    // === NEW: List all staff to populate assignment dropdown ===
    @GetMapping("/staff")
    public List<Staff> allStaff() {
        return service.allStaff();
    }
}
