package com.acueducto.backend.service;

import com.acueducto.backend.entity.Auditoria;
import com.acueducto.backend.repository.AuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

/**
 * Registra automaticamente las acciones importantes del sistema para garantizar
 * trazabilidad y transparencia (2.13 / 4.4).
 */
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public void registrar(String accion, String modulo, String registroAfectado, String observaciones) {
        Auditoria auditoria = Auditoria.builder()
                .usuario(usuarioActual())
                .fecha(LocalDateTime.now())
                .accion(accion)
                .modulo(modulo)
                .registroAfectado(registroAfectado)
                .ip(ipActual())
                .observaciones(observaciones)
                .build();
        auditoriaRepository.save(auditoria);
    }

    private String usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "publico";
        }
        return auth.getName();
    }

    private String ipActual() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return null;
            HttpServletRequest request = attributes.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            return forwarded != null ? forwarded : request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
