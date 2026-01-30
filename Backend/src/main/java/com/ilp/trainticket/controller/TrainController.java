
package com.ilp.trainticket.controller;

import com.ilp.trainticket.entity.Train;
import com.ilp.trainticket.repository.TrainRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Provides full train listing and filtered search by:
 * - origin
 * - destination
 * - date (optional for now)
 */
@RestController
@RequestMapping("/api/trains")
public class TrainController {

    private final TrainRepository trainRepo;

    public TrainController(TrainRepository trainRepo) {
        this.trainRepo = trainRepo;
    }

    /**
     * GET /api/trains
     * Returns all trains in DB.
     */
    @GetMapping
    public List<Train> getAllTrains() {
        return trainRepo.findAll();
    }

    /**
     * GET /api/trains/search?origin=Pune&destination=Mumbai&date=2026-01-20
     * Filters by origin and destination (case-insensitive).
     * Date filtering is optional.
     */
    @GetMapping("/search")
    public List<Train> searchTrains(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String date
    ) {
        List<Train> all = trainRepo.findAll();

        return all.stream()
                .filter(t -> t.getOrigin().equalsIgnoreCase(origin))
                .filter(t -> t.getDestination().equalsIgnoreCase(destination))
                .collect(Collectors.toList());
    }
}
