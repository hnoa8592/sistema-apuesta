package com.tecnoa.apuestas.api.exception;

public class AppException extends RuntimeException {
    private final int status;

    public AppException(String message, int status) {
        super(message);
        this.status = status;
    }

    public AppException(ErrorCode code, String message) {
        super(message);
        this.status = code.status.value();
    }

    public int getStatus() { return status; }
}