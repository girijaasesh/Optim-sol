package com.agilepro.security;

import com.agilepro.entity.User;
import com.agilepro.enums.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Value("${jwt.admin-expiration-ms}")
    private long adminExpirationMs;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey key() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        // Pad or truncate to 64 bytes for HS512
        byte[] paddedKey = new byte[64];
        System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, 64));
        return Keys.hmacShaKeyFor(paddedKey);
    }

    public String generateToken(User user) {
        long expiry = (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPER_ADMIN)
            ? adminExpirationMs : expirationMs;
        return buildToken(user.getEmail(), expiry, Map.of(
            "userId",   user.getId(),
            "role",     user.getRole().name(),
            "fullName", user.getFullName(),
            "tokenType","ACCESS"
        ));
    }

    public String generateRefreshToken(User user) {
        return buildToken(user.getEmail(), refreshExpirationMs, Map.of("tokenType", "REFRESH"));
    }

    public String generateMfaPendingToken(User user) {
        return buildToken(user.getEmail(), 300_000L, Map.of("tokenType", "MFA_PENDING"));
    }

    private String buildToken(String subject, long expiryMs, Map<String, Object> claims) {
        return Jwts.builder()
            .subject(subject)
            .claims(claims)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiryMs))
            .signWith(key())
            .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractTokenType(String token) {
        return (String) parseClaims(token).get("tokenType");
    }

    public boolean validateToken(String token) {
        try { parseClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) { log.warn("Invalid JWT: {}", e.getMessage()); return false; }
    }

    public String extractFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key()).build()
            .parseSignedClaims(token).getPayload();
    }
}
