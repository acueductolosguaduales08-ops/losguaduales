

### A. Publicaciones destacadas

Endpoint:
- GET /api/v1/publicaciones/destacadas

Salida esperada:
```json
[
  {
    "id": 1,
    "titulo": "Mantenimiento de la red",
    "descripcionCorta": "Se realizará mantenimiento...",
    "contenidoCompleto": "Texto completo",
    "imagenUrl": "https://...",
    "posicionImagen": "ARRIBA",
    "categoria": "Comunicados",
    "etiquetas": ["importante", "agua"],
    "autor": "admin",
    "estado": "PUBLICADA",
    "destacada": true,
    "fechaCreacion": "2026-07-13T10:30:00"
  }
]
detalles:
modal con la imagen arriba q importa donde este el texto completo podra ser texto enriquesido ( esta en publicaciones el html q te envie )

## B. Notificaciones públicas
Endpoint:
- GET /api/v1/notificaciones/publicas?page=0&size=5

Salida esperada:
```json
{
  "content": [
    {
      "id": 1,
      "titulo": "Corte programado",
      "descripcionCorta": "Habrá corte el viernes",
      "contenidoCompleto": "Detalle completo",
      "tipo": "AVISO",
      "prioridad": "ALTA",
      "estado": "PUBLICADA",
      "fechaPublicacion": "2026-07-13T08:00:00",
      "fechaVencimiento": "2026-07-14T23:59:59",
      "enlaceUrl": "https://ejemplo.com",
      "leida": false
    }
  ],
  "pageable": {},
  "totalElements": 1
}
```

Qué mostrar:
- título
- descripción corta
- prioridad
- fecha de publicación



---

### C. Encuestas públicas activas
Endpoint:
- GET /api/v1/encuestas/publicas

Salida esperada:
```json
[
  {
    "id": 1,
    "codigo": "ENC-001",
    "titulo": "Encuesta de calidad del servicio",
    "descripcion": "Tu opinión nos ayuda",
    "estado": "ACTIVA",
    "publico": true,
    "requiereAutenticacion": false,
    "respuestaUnica": true,
    "fechaInicio": "2026-07-01T00:00:00",
    "fechaFin": "2026-07-31T23:59:59",
    "codigoQr": "qr-code",
    "preguntas": []
  }
]
