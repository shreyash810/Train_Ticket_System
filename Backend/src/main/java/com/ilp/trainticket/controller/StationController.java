
package com.ilp.trainticket.controller;

import com.ilp.trainticket.entity.Train;
import com.ilp.trainticket.repository.TrainRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Provides a dynamic list of station names derived from Train.origin and Train.destination.
 * Optional query params:
 *  - exclude: station name to remove from the result (useful when an origin is selected)
 *  - q: case-insensitive search substring (for typeahead)
 *
 * Examples:
 *  GET /api/stations
 *  GET /api/stations?exclude=Pune
 *  GET /api/stations?q=mu
 *  GET /api/stations?exclude=Pune&q=mu
 */
@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final TrainRepository trainRepository;

    public StationController(TrainRepository trainRepository) {
        this.trainRepository = trainRepository;
    }

    @GetMapping
    public List<String> stations(@RequestParam(required = false) String exclude,
                                 @RequestParam(name = "q", required = false) String query) {

        // 1) Load all trains (works with H2 and your existing repository)
        List<Train> all = trainRepository.findAll();

        // 2) Collect unique station names from origin + destination (ignore null/blank)
        Set<String> unique = new HashSet<>();
        for (Train t : all) {
            if (t.getOrigin() != null && !t.getOrigin().isBlank()) {
                unique.add(t.getOrigin().trim());
            }
            if (t.getDestination() != null && !t.getDestination().isBlank()) {
                unique.add(t.getDestination().trim());
            }
        }

        // 3) Apply 'exclude' (case-insensitive)
        String excludeNorm = exclude != null ? exclude.trim().toLowerCase() : null;
        if (excludeNorm != null && !excludeNorm.isBlank()) {
            unique = unique.stream()
                    .filter(s -> !s.trim().toLowerCase().equals(excludeNorm))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }

        // 4) Apply 'q' filter for typeahead (contains, case-insensitive)
        String qNorm = query != null ? query.trim().toLowerCase() : null;
        if (qNorm != null && !qNorm.isBlank()) {
            unique = unique.stream()
                    .filter(s -> s.toLowerCase().contains(qNorm))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }

        // 5) Sort alphabetically (case-insensitive) for a stable dropdown
        return unique.stream()
                .sorted(Comparator.comparing(String::toLowerCase))
                .toList();
    }
}

