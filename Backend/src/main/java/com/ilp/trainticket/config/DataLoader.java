
package com.ilp.trainticket.config;

import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import com.ilp.trainticket.repository.*;
import com.ilp.trainticket.entity.*;
import com.ilp.trainticket.util.PasswordUtil;

import java.time.LocalDate;

@Component
public class DataLoader {

    private final TrainRepository trainRepository;
    private final AdminRepository adminRepository;
    private final StaffRepository staffRepository;
    private final PassengerRepository passengerRepository;
    private final ReservationRepository reservationRepository;

    public DataLoader(
            TrainRepository trainRepository,
            AdminRepository adminRepository,
            StaffRepository staffRepository,
            PassengerRepository passengerRepository,
            ReservationRepository reservationRepository
    ) {
        this.trainRepository = trainRepository;
        this.adminRepository = adminRepository;
        this.staffRepository = staffRepository;
        this.passengerRepository = passengerRepository;
        this.reservationRepository = reservationRepository;
    }

    @PostConstruct
    public void load() {
        // --- Trains (existing seed) ---
        if (trainRepository.count() == 0) {
            Train t1 = new Train();
            t1.setTrainNumber("TR1001");
            t1.setTrainName("Ahmedabad Express");
            t1.setOrigin("Ahmedabad");
            t1.setDestination("Delhi");
            t1.setTotalSeats(100);
            trainRepository.save(t1);

            Train t2 = new Train("TR1002", "Chennai Express", "Mumbai", "Chennai", 200);
            trainRepository.save(t2);

            Train t3 = new Train("TR1003", "Pune Express", "Pune", "Indore", 150);
            trainRepository.save(t3);
        }

        // --- Admin (demo) ---
        if (adminRepository.count() == 0) {
            Admin admin = new Admin();
            admin.setName("System Admin");
            admin.setEmail("admin@rail.in");
            // Note: Your demo login uses frontend-only gating; storing password for completeness
            admin.setPassword(PasswordUtil.hash("Admin@123"));
            adminRepository.save(admin);
        }

        // --- Staff (two records) ---
        if (staffRepository.count() == 0) {
            Staff s1 = new Staff();
            s1.setName("Ramesh");
            s1.setDepartment("Cleaning");
            s1.setEmail("ramesh@rail.in");
            staffRepository.save(s1);

            Staff s2 = new Staff();
            s2.setName("Anita");
            s2.setDepartment("Billing");
            s2.setEmail("anita@rail.in");
            staffRepository.save(s2);
        }

        // --- Passengers (two demo passengers) ---
        // Password hashing consistent with PassengerService (PasswordUtil.hash)
        if (passengerRepository.count() == 0) {
            Passenger p1 = new Passenger();
            p1.setName("Amit Patil");
            p1.setEmail("amit.patil@example.com");
            p1.setMobile("+919876543210");
            p1.setAddress("Pune, MH");
            p1.setDob(LocalDate.parse("1990-01-10")); // ISO yyyy-MM-dd
            p1.setPassword(PasswordUtil.hash("Amit@123"));
            p1 = passengerRepository.save(p1);

            Passenger p2 = new Passenger();
            p2.setName("Sneha Joshi");
            p2.setEmail("sneha.joshi@example.com");
            p2.setMobile("+919123456789");
            p2.setAddress("Mumbai, MH");
            p2.setDob(LocalDate.parse("1995-09-20"));
            p2.setPassword(PasswordUtil.hash("Sneha@123"));
            p2 = passengerRepository.save(p2);

            // --- Seed 2 Reservations for p1: one past, one upcoming ---
            Train anyTrain = trainRepository.findAll().stream().findFirst().orElse(null);
            if (anyTrain != null) {
                Reservation past = new Reservation();
                past.setPassenger(p1);
                past.setTrain(anyTrain);
                past.setTravelDate(LocalDate.now().minusDays(5));
                past.setStatus("CONFIRMED");
                reservationRepository.save(past);

                Reservation upcoming = new Reservation();
                upcoming.setPassenger(p1);
                upcoming.setTrain(anyTrain);
                upcoming.setTravelDate(LocalDate.now().plusDays(10));
                upcoming.setStatus("CONFIRMED");
                reservationRepository.save(upcoming);
            }
        }
    }
}
