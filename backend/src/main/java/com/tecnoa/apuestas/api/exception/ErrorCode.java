package com.tecnoa.apuestas.api.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    PREDICTION_DEADLINE_PASSED(HttpStatus.CONFLICT),
    GROUP_FULL(HttpStatus.CONFLICT),
    WRONG_PASSWORD(HttpStatus.FORBIDDEN),
    ALREADY_MEMBER(HttpStatus.CONFLICT),
    PROFILE_INCOMPLETE(HttpStatus.FORBIDDEN),
    GROUP_ALREADY_STARTED(HttpStatus.CONFLICT),
    WILDCARDS_LOCKED(HttpStatus.CONFLICT),
    TOKEN_EXPIRED(HttpStatus.GONE),
    INVALID_INVITE_CODE(HttpStatus.NOT_FOUND),
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND),
    TOURNAMENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    MATCH_NOT_FOUND(HttpStatus.NOT_FOUND),
    TEAM_NOT_FOUND(HttpStatus.NOT_FOUND),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND),
    NOT_GROUP_MEMBER(HttpStatus.FORBIDDEN),
    NOT_ORGANIZER(HttpStatus.FORBIDDEN),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED);

    public final HttpStatus status;
    ErrorCode(HttpStatus status) { this.status = status; }
}
