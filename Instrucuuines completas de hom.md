## A. Portal público — lo que carga la pantalla de Inicio (sin sesión)

Todos estos son `GET`, no requieren token, y son los que consume `home.html`/`gallery.html`.

### 1. Notificaciones públicas
```
GET /api/v1/notificaciones/publicas?page=0&size=10&sort=fechaPublicacion,desc
```
**Respuesta 200:**
```json
{
  "content": [
    {
      "id": 3,
      "titulo": "Corte programado de agua",
      "descripcionCorta": "Mantenimiento en la red principal",
      "contenidoCompleto": "El día jueves...",
      "tipo": "PUBLICA",
      "prioridad": "ALTA",
      "estado": "ACTIVA",
      "fechaPublicacion": "2026-07-10T08:00:00",
      "fechaVencimiento": null,
      "enlaceUrl": null,
      "leida": false
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0
}
```

### 2. Publicaciones publicadas (galería/feed)
```
GET /api/v1/publicaciones/publicas?page=0&size=10
```
**Respuesta 200:**
```json
{
  "content": [
    {
      "id": 12,
      "titulo": "Jornada de limpieza",
      "descripcionCorta": "Limpieza de la bocatoma con la comunidad",
      "contenidoCompleto": "<p>El pasado sábado...</p>",
      "imagenUrl": "https://ejemplo.com/foto.jpg",
      "posicionImagen": null,
      "categoria": "Eventos",
      "etiquetas": ["comunidad"],
      "autor": "admin",
      "estado": "PUBLICADA",
      "destacada": true,
      "fechaCreacion": "2026-07-05T14:30:00"
    }
  ],
  "totalElements": 1
}
```

### 3. Publicaciones destacadas
```
GET /api/v1/publicaciones/destacadas
```
**Respuesta 200:** array simple (sin paginación), mismo objeto que arriba:
```json
[
  { "id": 12, "titulo": "Jornada de limpieza", "destacada": true, "...": "..." }
]
```

### 4. Categorías (para armar los filtros de la galería)
```
GET /api/v1/publicaciones/categorias
```
**Respuesta 200:**
```json
[
  { "id": 1, "nombre": "Eventos" },
  { "id": 2, "nombre": "Mantenimiento" }
]
```

### 5. Reacciones de una publicación (leer)
```
GET /api/v1/publicaciones/12/reacciones
```
**Respuesta 200:**
```json
[
  { "emoji": "👍", "contador": 8 },
  { "emoji": "❤️", "contador": 3 }
]
```

### 6. Reaccionar (público, sin sesión)
```
POST /api/v1/publicaciones/12/reacciones?emoji=👍
```
**Respuesta 200:**
```json
{ "emoji": "👍", "contador": 9 }
```

### 7. Quitar una reacción
```
DELETE /api/v1/publicaciones/12/reacciones?emoji=👍
```
**Respuesta:** `204 No Content`

### 8. Formularios/encuestas activas
```
GET /api/v1/encuestas/publicas
```
**Respuesta 200:** array de objetos `EncuestaResponse` (título, descripción, preguntas, código QR).

---

## B. Crear y gestionar publicaciones (requiere sesión Tesorero o Administrador)

Primero autentica: `POST /api/v1/auth/login` → copia el `accessToken` → mándalo en `Authorization: Bearer {token}` en todo lo siguiente.

### 1. Crear una publicación
```
POST /api/v1/publicaciones
Authorization: Bearer {token}
```
**Body de entrada:**
```json
{
  "titulo": "Jornada de limpieza",
  "descripcionCorta": "Limpieza de la bocatoma con la comunidad",
  "contenidoCompleto": "<p>El pasado sábado...</p>",
  "imagenUrl": "https://ejemplo.com/foto.jpg",
  "posicionImagen": null,
  "categoriaId": 1,
  "etiquetasIds": [],
  "destacada": false
}
```
**Respuesta 200:** el objeto creado, con `estado: "BORRADOR"` (nace oculta, hay que publicarla aparte):
```json
{
  "id": 12,
  "titulo": "Jornada de limpieza",
  "estado": "BORRADOR",
  "destacada": false,
  "fechaCreacion": "2026-07-14T10:00:00",
  "...": "..."
}
```

### 2. Publicarla (para que sea visible en el portal)
```
POST /api/v1/publicaciones/12/publicar
```
**Respuesta:** `200 OK` con el objeto, ahora `"estado": "PUBLICADA"`.

### 3. Ocultarla de nuevo
```
POST /api/v1/publicaciones/12/ocultar
```
→ `"estado": "OCULTA"`

### 4. Destacar/quitar destacado
```
PATCH /api/v1/publicaciones/12/destacar?destacada=true
```

### 5. Editar
```
PUT /api/v1/publicaciones/12
```
Mismo body que crear (paso 1), reemplaza todo el registro.

### 6. Ver el detalle (para cargarlo en el formulario de edición)
```
GET /api/v1/publicaciones/12
```

### 7. Listar todas (incluye borradores/ocultas, para el panel de edición)
```
GET /api/v1/publicaciones/admin?page=0&size=20
```

### 8. Eliminar definitivamente (solo Administrador)
```
DELETE /api/v1/publicaciones/12
```
→ `204 No Content`

### 9. Crear categoría nueva (Tesorero o Administrador)
```
POST /api/v1/publicaciones/categorias
```
```json
{ "nombre": "Eventos" }
```

---

## C. Consulta pública de factura y recibo (sin iniciar sesión)

Esto es lo que usa cualquier persona que **no tiene cuenta** — por ejemplo, escaneando el QR impreso en su factura, o escribiendo el número manualmente en `consultas.html`.

### Cómo funciona
- No necesitas token.
- No consultas por el `id` interno de la base de datos, sino por el **número visible** del documento (el que trae impreso: `FAC-000001`, `REC-000001`).
- Solo te devuelve la información necesaria para verificar el documento — no expone datos de otras facturas ni de otros asociados.

### Consultar una factura
```
GET /api/v1/facturas/qr/FAC-000042
```
**Respuesta 200:**
```json
{
  "id": 42,
  "numeroFactura": "FAC-000042",
  "asociadoId": 7,
  "asociadoNombre": "Juan Carlos Pérez Gómez",
  "numeroMedidor": "MED-0001",
  "fechaEmision": "2026-07-01",
  "fechaLimitePago": "2026-07-16",
  "lecturaAnterior": 120,
  "lecturaActual": 135,
  "consumoM3": 15,
  "valorConsumo": 22500,
  "cargoAdministracion": 8000,
  "valoresAdicionales": 0,
  "totalMultas": 0,
  "total": 30500,
  "totalPagado": 0,
  "saldoPendiente": 30500,
  "estado": "PENDIENTE",
  "codigoQr": "data:image/png;base64,..."
}
```
**Si no existe:** `404 Not Found`
```json
{ "status": 404, "error": "Recurso no encontrado", "mensaje": "Factura no encontrada: FAC-000042" }
```

### Consultar un recibo
```
GET /api/v1/recibos/qr/REC-000030
```
**Respuesta 200:**
```json
{
  "id": 30,
  "numeroRecibo": "REC-000030",
  "numeroFactura": "FAC-000042",
  "asociadoId": 7,
  "asociadoNombre": "Juan Carlos Pérez Gómez",
  "fechaEmision": "2026-07-05T09:15:00",
  "valor": 30500,
  "saldoPendiente": 0,
  "metodoPago": "Efectivo",
  "estado": "EMITIDO",
  "codigoQr": "data:image/png;base64,..."
}
```

### Ver la factura o el recibo con el diseño oficial (HTML/PDF) — esto sí requiere sesión
```
GET /api/v1/facturas/{id}/html      GET /api/v1/facturas/{id}/pdf
GET /api/v1/recibos/{numeroRecibo}/html   GET /api/v1/recibos/{numeroRecibo}/pdf
```
Estos cuatro **sí piden token** (Asociado dueño de la factura, Tesorero o Administrador), a diferencia de los dos de arriba (`/qr/...`), que son abiertos. La razón: el endpoint `/qr/...` solo confirma el documento y muestra cifras resumidas — pensado para que cualquiera que encuentre el papel pueda verificarlo rápido — mientras que el HTML/PDF completo muestra el documento oficial con todos los datos, así que se protege con login.

### Consultar el estado del servicio (otra opción pública, sin QR)
```
GET /api/v1/consultas/estado-servicio?documento=1020304050
```
**Respuesta 200:**
```json
{ "codigoInterno": "ASO-00001", "nombreCompleto": "Juan Carlos Pérez Gómez", "estadoServicio": "ACTIVO" }
```

---
### aclaracion de las galerias (gallery)

Funcionamiento

La galería utiliza exactamente los mismos endpoints que las publicaciones.

La diferencia entre una publicación normal y una imagen de la galería se determina únicamente por su categoría.

Cuando el administrador crea contenido para la galería, realmente está creando una publicación.

La única diferencia es que la categoría seleccionada será:

gallery

El frontend será el encargado de interpretar esta categoría y decidir dónde mostrar el contenido.

Reglas de funcionamiento

Una publicación cuya categoría sea gallery:

No deberá aparecer en la lista de noticias o publicaciones.
Deberá mostrarse únicamente dentro de la sección Galería.
Utilizará el mismo modelo de datos que cualquier publicación.
Utilizará los mismos endpoints para crear, editar, publicar, ocultar y eliminar contenido.
Podrá marcarse como borrador, publicada u oculta igual que cualquier otra publicación.
Podrá recibir reacciones públicas mediante emojis.
Diferencias con una publicación normal

Aunque ambas utilizan el mismo modelo de datos, el frontend deberá tratarlas de forma diferente.

la galeria solo tiene 

- titulo
- descripcion corta en el modal 
- etiqueta
- imagenurl
lo demas un valor por defaul si la api lo exige 