
package com.ilp.trainticket.service;

import org.springframework.stereotype.Service;
import com.ilp.trainticket.repository.PassengerRepository;
import com.ilp.trainticket.entity.Passenger;
import com.ilp.trainticket.dto.*;
import com.ilp.trainticket.util.PasswordUtil;
import com.ilp.trainticket.exception.ApiException;

@Service
public class PassengerService {

    private final PassengerRepository repo;

    public PassengerService(PassengerRepository repo) {
        this.repo = repo;
    }

    public Passenger register(RegisterRequest r) {
        if (repo.existsByEmail(r.email)) {
            throw new ApiException("Email already registered");
        }
        Passenger p = new Passenger();
        p.setName(r.name);
        p.setEmail(r.email);
        p.setMobile(r.mobile);
        p.setAddress(r.address);
        p.setDob(r.dob);
        p.setPassword(PasswordUtil.hash(r.password));
        return repo.save(p);
    }

    public Passenger login(LoginRequest r) {
        Passenger p = repo.findAll().stream()
                .filter(x -> x.getEmail().equals(r.email))
                .findFirst()
                .orElseThrow(() -> new ApiException("Invalid email or password"));

        if (!PasswordUtil.match(r.password, p.getPassword())) {
            throw new ApiException("Invalid email or password");
        }
        return p;
    }

    // ===== NEW: Profile read/update =====
    public PassengerDto getById(Long id) {
        Passenger p = repo.findById(id).orElseThrow(() -> new ApiException("Passenger not found"));
        return new PassengerDto(p.getId(), p.getName(), p.getEmail(), p.getMobile(), p.getAddress(), p.getDob());
    }

    public PassengerDto updateById(Long id, UpdatePassengerRequest req) {
        Passenger p = repo.findById(id).orElseThrow(() -> new ApiException("Passenger not found"));
        if (req.name() != null)   p.setName(req.name());
        if (req.mobile() != null) p.setMobile(req.mobile());
        if (req.address() != null)p.setAddress(req.address());
        Passenger saved = repo.save(p);
        return new PassengerDto(saved.getId(), saved.getName(), saved.getEmail(), saved.getMobile(), saved.getAddress(), saved.getDob());
    }
}
