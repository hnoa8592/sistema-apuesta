package com.tecnoa.apuestas.infrastructure.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.tecnoa.apuestas.config.AppProperties;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleTokenVerifier {

    private final AppProperties props;
    private GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(AppProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() {
        verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(props.google().clientId()))
                .build();
    }

    public GoogleIdToken.Payload verify(String idToken) {
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) throw new IllegalArgumentException("Invalid Google token");
            return token.getPayload();
        } catch (Exception e) {
            throw new IllegalArgumentException("Google token verification failed: " + e.getMessage(), e);
        }
    }
}
