package com.acueducto.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/** Registra ingresos extraordinarios o gastos (Modulo 8): tipo se decide segun el endpoint invocado. */
public record MovimientoTesoreriaRequest(
        @NotNull @Positive BigDecimal valor,
        @NotNull Long metodoPagoId,
        @NotBlank String concepto,
        String categoria,
        String observaciones,
        Long asociadoId,
        @NotNull Long mesContableId,
        String comprobanteUrl
) {
}
