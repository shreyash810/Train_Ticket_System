
package com.ilp.trainticket.controller;

import com.ilp.trainticket.dto.PaymentRequest;
import com.ilp.trainticket.dto.PaymentDto;
import com.ilp.trainticket.entity.Payment;
import com.ilp.trainticket.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping
    public Payment create(@RequestBody PaymentRequest req) {
        return service.recordPayment(req);
    }

    // NEW: payments for logged-in passenger (passengerId supplied by frontend session)
    @GetMapping("/user/{passengerId}")
    public List<PaymentDto> myPayments(@PathVariable Long passengerId) {
        return service.listByPassenger(passengerId);
    }
}
