
package com.ilp.trainticket.exception;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<String> handle(ApiException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
