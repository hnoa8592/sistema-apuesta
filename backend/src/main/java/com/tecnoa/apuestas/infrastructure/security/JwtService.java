package com.tecnoa.apuestas.infrastructure.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.tecnoa.apuestas.config.AppProperties;
import com.tecnoa.apuestas.domain.model.enums.UserRole;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final int expirationDays;

    public JwtService(AppProperties props) {
        this.algorithm = Algorithm.HMAC256(props.jwt().secret());
        this.expirationDays = props.jwt().expirationDays();
    }

    public String generateToken(UUID userId, String email, UserRole role) {
        return JWT.create()
                .withSubject(userId.toString())
                .withClaim("email", email)
                .withClaim("role", role.name())
                .withIssuedAt(Date.from(Instant.now()))
                .withExpiresAt(Date.from(Instant.now().plus(expirationDays, ChronoUnit.DAYS)))
                .sign(algorithm);
    }

    public DecodedJWT validateToken(String token) throws JWTVerificationException {
        return JWT.require(algorithm).build().verify(token);
    }

    public UUID extractUserId(DecodedJWT jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public UserRole extractRole(DecodedJWT jwt) {
        String roleStr = jwt.getClaim("role").asString();
        return roleStr != null ? UserRole.valueOf(roleStr) : UserRole.USER;
    }
}
