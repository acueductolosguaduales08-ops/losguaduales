package com.acueducto.backend.dto.request;

import com.acueducto.backend.entity.enums.PrioridadNotificacion;
import com.acueducto.backend.entity.enums.TipoNotificacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record NotificacionRequest(
        @NotBlank String titulo,
        String descripcionCorta,
        String contenidoCompleto,
        @NotNull TipoNotificacion tipo,
        PrioridadNotificacion prioridad,
        LocalDateTime fechaPublicacion,
        LocalDateTime fechaVencimiento,
        Long destinatarioId,
        String enlaceUrl
) {
}
