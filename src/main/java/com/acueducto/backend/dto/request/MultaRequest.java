package com.acueducto.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record MultaRequest(
        @NotNull Long asociadoId,
        Long facturaId,
        @NotBlank String motivo,
        @NotNull @Positive BigDecimal valor
) {
}
