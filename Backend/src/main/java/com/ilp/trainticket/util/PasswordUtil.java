
package com.ilp.trainticket.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordUtil {
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    public static String hash(String raw) {
        return encoder.encode(raw);
    }
    public static boolean match(String raw, String hashed) {
        return encoder.matches(raw, hashed);
    }
}
