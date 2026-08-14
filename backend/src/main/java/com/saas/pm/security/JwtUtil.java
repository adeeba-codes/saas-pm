package com.saas.pm.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final SecretKey key;

    public JwtUtil(@Value("${JWT_SECRET}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException(
                "JWT_SECRET must be at least 32 characters long"
            );
        }

        this.key = Keys.hmacShaKeyFor(
            secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static final long EXPIRATION_MS = 1000 * 60 * 60 * 24;

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
        return UUID.fromString(
                parseToken(token).get("organizationId", String.class)
        );
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }
}
