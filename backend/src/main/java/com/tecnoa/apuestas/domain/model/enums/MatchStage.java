package com.tecnoa.apuestas.domain.model.enums;

public enum MatchStage {
    GROUP(1, 3),
    ROUND_OF_16(3, 5),
    QUARTER_FINAL(5, 8),
    SEMI_FINAL(7, 10),
    THIRD_PLACE(8, 12),
    FINAL(10, 15);

    public final int correctResult;
    public final int exactScore;

    MatchStage(int correctResult, int exactScore) {
        this.correctResult = correctResult;
        this.exactScore = exactScore;
    }
}
