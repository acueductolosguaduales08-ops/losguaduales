package com.acueducto.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VideoRequest(@NotBlank String titulo, String descripcion, @NotBlank String urlVideo) {
}
