
package com.ilp.trainticket.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.ilp.trainticket.repository.TrainRepository;
import com.ilp.trainticket.entity.Train;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final TrainRepository repo;

    public SearchController(TrainRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/trains")
    public List<Train> search() {
        return repo.findAll();
    }
}
