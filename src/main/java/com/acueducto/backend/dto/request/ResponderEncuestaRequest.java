package com.acueducto.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ResponderEncuestaRequest(
        @NotEmpty List<RespuestaPreguntaItem> respuestas
) {
    public record RespuestaPreguntaItem(Long preguntaId, String valor) {
    }
}
