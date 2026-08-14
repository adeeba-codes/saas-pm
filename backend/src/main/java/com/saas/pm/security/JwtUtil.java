package com.saas.pm.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    // In production, load this from an environment variable, never hardcode.
    private final SecretKey key = Keys.hmacShaKeyFor(
        "replace-this-with-a-real-32-char-min-secret-key".getBytes()
    );

    private static final long EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24 hours

    // The key design decision: the token carries organizationId and role
    // as claims. This means every request is "self-describing" — the
    // backend doesn't need a DB lookup just to know which tenant a
    // request belongs to. That's what makes tenant filtering fast.
    public String generateToken(UUID userId, UUID organizationId, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("organizationId", organizationId.toString())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getUserId(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    public UUID getOrganizationId(String token) {
        return UUID.fromString(parseToken(token).get("organizationId", String.class));
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }
}
