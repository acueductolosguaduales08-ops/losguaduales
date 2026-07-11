package com.acueducto.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;

/** Traduce todas las excepciones de negocio y de validacion a respuestas JSON consistentes (2.14 / 4.8). */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleNoEncontrado(RecursoNoEncontradoException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "Recurso no encontrado", ex.getMessage(), req, null);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(ReglaNegocioException ex, HttpServletRequest req) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "Regla de negocio incumplida", ex.getMessage(), req, null);
    }

    @ExceptionHandler(RecursoDuplicadoException.class)
    public ResponseEntity<ErrorResponse> handleDuplicado(RecursoDuplicadoException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "Recurso duplicado", ex.getMessage(), req, null);
    }

    @ExceptionHandler(AccesoDenegadoModuloException.class)
    public ResponseEntity<ErrorResponse> handleAccesoModulo(AccesoDenegadoModuloException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "Acceso denegado", ex.getMessage(), req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "Acceso denegado", "No tiene permisos para realizar esta accion.", req, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "Credenciales invalidas", "Usuario o contrasena incorrectos.", req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> detalles = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Error de validacion", "Uno o mas campos son invalidos.", req, detalles);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno", "Ocurrio un error inesperado. Intente nuevamente.", req, null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String error, String mensaje,
                                                 HttpServletRequest req, List<String> detalles) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .mensaje(mensaje)
                .path(req.getRequestURI())
                .detalles(detalles)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
