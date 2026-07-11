package com.acueducto.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record PublicacionRequest(
        @NotBlank String titulo,
        String descripcionCorta,
        String contenidoCompleto,
        String imagenUrl,
        String posicionImagen,
        Long categoriaId,
        List<Long> etiquetasIds,
        boolean destacada
) {
}
