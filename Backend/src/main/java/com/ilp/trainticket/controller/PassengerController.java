
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import com.ilp.trainticket.service.PassengerService;
import com.ilp.trainticket.dto.*;
import com.ilp.trainticket.entity.Passenger;

@RestController
@RequestMapping("/api/passenger")
public class PassengerController {

    private final PassengerService service;

    public PassengerController(PassengerService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public Passenger register(@RequestBody RegisterRequest r) {
        return service.register(r);
    }

    @PostMapping("/login")
    public Passenger login(@RequestBody LoginRequest r) {
        return service.login(r);
    }

    // ==== NEW ====
    @GetMapping("/{id}")
    public PassengerDto get(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public PassengerDto update(@PathVariable Long id, @RequestBody UpdatePassengerRequest req) {
        return service.updateById(id, req);
    }
}
