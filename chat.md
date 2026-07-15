todos los enpoins de  Portal Publico
Galeria, publicaciones destacadas, categorias, etiquetas y videos (Modulo 11)



DELETE
/api/v1/publicaciones/{id}/reacciones
Quitar una reaccion propia


DELETE
/api/v1/publicaciones/{id}
Eliminar publicacion definitivamente



GET
/api/v1/publicaciones/{id}/reacciones
Ver reacciones de una publicacion


GET
/api/v1/publicaciones/etiquetas
Listar etiquetas


GET
/api/v1/publicaciones/categorias
Listar categorias


GET
/api/v1/publicaciones/videos/publicos
Listar videos publicos


GET
/api/v1/publicaciones/publicas
Galeria publica


GET
/api/v1/publicaciones/destacadas
Publicaciones destacadas


PATCH
/api/v1/publicaciones/{id}/destacar
Destacar/quitar destacado



PATCH
/api/v1/publicaciones/videos/{id}/ocultar
Ocultar video



POST
/api/v1/publicaciones
Crear publicacion



POST
/api/v1/publicaciones/{id}/reacciones
Reaccionar a una publicacion


POST
/api/v1/publicaciones/{id}/publicar
Publicar contenido



POST
/api/v1/publicaciones/{id}/ocultar
Ocultar contenido



POST
/api/v1/publicaciones/videos
Publicar video



POST
/api/v1/publicaciones/etiquetas
Crear etiqueta



POST
/api/v1/publicaciones/categorias
Crear categoria

GET
/api/v1/consultas/estado-servicio
Consultar estado del servicio por documento

## Pantalla de inicio:

### A. Publicaciones destacadas  (utima parte del home, Html q te envie ya tiene modoal y disño solo falta idear una mejor forma para los emogis)

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
```

Qué mostrar en la pantalla:
- título
- descripción corta
- imagen
- fecha
- categoría
- likes o emogies 
GET
/api/v1/publicaciones/{id}/reacciones
Ver reacciones de una publicacion

Conteo total por cada emoji. Publico (11.x).
[
  {
    "emoji": "string",
    "contador": 0
  }
]

DELETE
/api/v1/publicaciones/{id}/reacciones
Quitar una reaccion propia
---

### B. Notificaciones públicas

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

### C. Encuestas públicas activas(creo q ya lo tiene el home "no funcional)
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
```

Qué mostrar:
- título
- descripción
- estado
- botón para entrar a responder (q solo aparesca por el momento )

---

### D. Consulta pública de estado de servicio
Endpoint:
- GET /api/v1/consultas/estado-servicio?documento=123456789

Salida esperada:
```json
{
  "codigoInterno": "INT-001",
  "nombreCompleto": "Juan Pérez",
  "estadoServicio": "ACTIVO"
}
```

Qué mostrar:
- si encontró el usuario
- estado de servicio
- nombre completo

---

## 2) Datos de entrada para la pantalla de inicio

### Para la consulta pública
```bash
curl -X GET "http://localhost:8080/api/v1/consultas/estado-servicio?documento=123456789"
```

### Para publicaciones destacadas
```bash
curl -X GET "http://localhost:8080/api/v1/publicaciones/destacadas"
```

### Para notificaciones públicas
```bash
curl -X GET "http://localhost:8080/api/v1/notificaciones/publicas?page=0&size=5"
```

### Para encuestas públicas
```bash
curl -X GET "http://localhost:8080/api/v1/encuestas/publicas"
```

---

## 3) Qué necesita la pantalla de inicio
La pantalla de inicio esta formada por 5 bloques:

1. Hero (con el borde inferior del html home q tengo no es nesesario un mensage de bienbenida aqui) 
2. targetas de consulta ( consultar estado con un input para el documento al ladito un qr para consultar facturas o recibos)


GET
/api/v1/recibos/qr/{numeroRecibo}
Consultar recibo via codigo QR



GET
/api/v1/facturas/qr/{numeroFactura}
Consultar factura via codigo QR

3.gallery imagenes subidas por url con filtro y todas la img hacia la derecha (este no tiene enpoint todavia pero podriamos  hacer que sea sel mismo de publicaciones solo que se innora lo demas se agrega la imagen la descrpcion las reacciones  titulo y fecha este funcionara solo con la etiqueta galeria cambia la edicion y solo quedan estos datos a para llenar y contaria como una publicacion con una etiqueta galeria)

4.destacados y publicaciones los que no tengan la etiqueta galeria (el diseño de publicaciones.html)


GET
/api/v1/publicaciones/publicas
Galeria publica

Example Value
Schema
{
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "numberOfElements": 0,
  "size": 0,
  "content": [
    {
      "id": 0,
      "titulo": "string",
      "descripcionCorta": "string",
      "contenidoCompleto": "string",
      "imagenUrl": "string",
      "posicionImagen": "string",
      "categoria": "string",
      "etiquetas": [
        "string"
      ],
      "autor": "string",
      "estado": "BORRADOR",
      "destacada": true,
      "fechaCreacion": "2026-07-14T03:48:59.890Z"
    }
  ],
  "number": 0,
  "sort": [
    {
      "direction": "string",
      "nullHandling": "string",
      "ascending": true,
      "property": "string",
      "ignoreCase": true
    }
  ],
  "pageable": {
    "offset": 0,
    "sort": [
      {
        "direction": "string",
        "nullHandling": "string",
        "ascending": true,
        "property": "string",
        "ignoreCase": true
      }
    ],
    "paged": true,
    "pageSize": 0,
    "pageNumber": 0,
    "unpaged": true
  },
  "empty": true
}


5.videos
POST
/api/v1/publicaciones/videos
Publicar video

y el boton de etar q tengo en el html boton para editar este abre la edicion de la pantalla de inicio solo es visble para los roles  admin y tesorero sigu el mismo estilo en el html q te envie tienes material para las publicaciones recomiendo q uses ese ademas si falta alguna fincion q consideres que es importante para el inicio y se me paso por alto me dices y miramos su la ponemos  o no 
---

## 4) Recomendación 
Para la pantalla de inicio, no necesitas auth. Solo usa los endpoints públicos. entonses agrega a la barra de navegacion q tiene la haburgueza de home un iniciar seccion y agraga un modo oscuro

...........

12. Portal Publico
Galeria, publicaciones destacadas, categorias, etiquetas y videos (Modulo 11)



DELETE
/api/v1/publicaciones/{id}/reacciones
Quitar una reaccion propia

Resta 1 al contador del emoji indicado (nunca baja de cero). Publico.

Parameters
Try it out
Name	Description
id *
integer($int64)
(path)
id
emoji *
string
(query)
emoji
Responses
Code	Description	Links
200	
OK

No links

DELETE
/api/v1/publicaciones/{id}
Eliminar publicacion definitivamente


Exclusivo del Administrador (11.10).

Parameters
Try it out
Name	Description
id *
integer($int64)
(path)
id
Responses
Code	Description	Links
200	
OK

No links

GET
/api/v1/publicaciones/{id}/reacciones
Ver reacciones de una publicacion

Conteo total por cada emoji. Publico (11.x).

Parameters
Cancel
Name	Description
id *
integer($int64)
(path)
2
Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:8080/api/v1/publicaciones/2/reacciones' \
  -H 'accept: application/json'
Request URL
http://localhost:8080/api/v1/publicaciones/2/reacciones
Server response
Code	Details
200	
Response body
Download
[
  {
    "emoji": "👍",
    "contador": 2
  },
  {
    "emoji": "💀",
    "contador": 1
  }
]
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:05:19 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "emoji": "string",
    "contador": 0
  }
]
No links

GET
/api/v1/publicaciones/etiquetas
Listar etiquetas

Parameters
Cancel
No parameters

Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:8080/api/v1/publicaciones/etiquetas' \
  -H 'accept: application/json'
Request URL
http://localhost:8080/api/v1/publicaciones/etiquetas
Server response
Code	Details
200	
Response body
Download
[
  {
    "id": 1,
    "fechaCreacion": "2026-07-13T23:55:44.364005",
    "fechaModificacion": "2026-07-13T23:55:44.364005",
    "creadoPor": "admin",
    "modificadoPor": "admin",
    "nombre": "galeria",
    "color": "blue"
  }
]
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:02:38 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": 0,
    "fechaCreacion": "2026-07-14T05:05:19.787Z",
    "fechaModificacion": "2026-07-14T05:05:19.787Z",
    "creadoPor": "string",
    "modificadoPor": "string",
    "nombre": "string",
    "color": "string"
  }
]
No links

GET
/api/v1/publicaciones/categorias
Listar categorias

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": 0,
    "fechaCreacion": "2026-07-14T05:05:19.792Z",
    "fechaModificacion": "2026-07-14T05:05:19.792Z",
    "creadoPor": "string",
    "modificadoPor": "string",
    "nombre": "string"
  }
]
No links

GET
/api/v1/publicaciones/videos/publicos
Listar videos publicos

Parameters
Cancel
No parameters

Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:8080/api/v1/publicaciones/videos/publicos' \
  -H 'accept: application/json'
Request URL
http://localhost:8080/api/v1/publicaciones/videos/publicos
Server response
Code	Details
200	
Response body
Download
[
  {
    "id": 1,
    "fechaCreacion": "2026-07-13T23:58:26.995731",
    "fechaModificacion": "2026-07-13T23:58:26.995731",
    "creadoPor": "admin",
    "modificadoPor": "admin",
    "titulo": "Ejemplo",
    "descripcion": "llllllllllllllllllllllllllll",
    "urlVideo": "https://youtu.be/zdfNMMowNnc?si=RkVaqUOKBIx-4K0P",
    "visible": true
  }
]
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:02:31 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": 0,
    "fechaCreacion": "2026-07-14T05:05:19.802Z",
    "fechaModificacion": "2026-07-14T05:05:19.802Z",
    "creadoPor": "string",
    "modificadoPor": "string",
    "titulo": "string",
    "descripcion": "string",
    "urlVideo": "string",
    "visible": true
  }
]
No links

GET
/api/v1/publicaciones/publicas
Galeria publica

Publicaciones publicadas, disponible sin login (11.5).

Parameters
Try it out
Name	Description
pageable *
object
(query)
{
  "page": 0,
  "size": 1,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "numberOfElements": 0,
  "size": 0,
  "content": [
    {
      "id": 0,
      "titulo": "string",
      "descripcionCorta": "string",
      "contenidoCompleto": "string",
      "imagenUrl": "string",
      "posicionImagen": "string",
      "categoria": "string",
      "etiquetas": [
        "string"
      ],
      "autor": "string",
      "estado": "BORRADOR",
      "destacada": true,
      "fechaCreacion": "2026-07-14T05:05:19.811Z"
    }
  ],
  "number": 0,
  "sort": [
    {
      "direction": "string",
      "nullHandling": "string",
      "ascending": true,
      "property": "string",
      "ignoreCase": true
    }
  ],
  "pageable": {
    "offset": 0,
    "sort": [
      {
        "direction": "string",
        "nullHandling": "string",
        "ascending": true,
        "property": "string",
        "ignoreCase": true
      }
    ],
    "paged": true,
    "pageSize": 0,
    "pageNumber": 0,
    "unpaged": true
  },
  "empty": true
}
No links

GET
/api/v1/publicaciones/destacadas
Publicaciones destacadas

Disponible sin login (11.6).

Parameters
Cancel
No parameters

Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:8080/api/v1/publicaciones/destacadas' \
  -H 'accept: application/json'
Request URL
http://localhost:8080/api/v1/publicaciones/destacadas
Server response
Code	Details
200	
Response body
Download
[
  {
    "id": 2,
    "titulo": "string",
    "descripcionCorta": "string",
    "contenidoCompleto": "stringhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
    "imagenUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0TzpUNpB0aQSzSpbBw2C1QIuCPfvIRJvYBo540762Xw&s=10",
    "posicionImagen": "ARRIBA",
    "categoria": "galeria",
    "etiquetas": [],
    "autor": "admin",
    "estado": "PUBLICADA",
    "destacada": true,
    "fechaCreacion": "2026-07-14T00:01:17.457765"
  }
]
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:02:14 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": 0,
    "titulo": "string",
    "descripcionCorta": "string",
    "contenidoCompleto": "string",
    "imagenUrl": "string",
    "posicionImagen": "string",
    "categoria": "string",
    "etiquetas": [
      "string"
    ],
    "autor": "string",
    "estado": "BORRADOR",
    "destacada": true,
    "fechaCreacion": "2026-07-14T05:05:19.820Z"
  }
]
No links

PATCH
/api/v1/publicaciones/{id}/destacar
Destacar/quitar destacado


Parameters
Cancel
Name	Description
id *
integer($int64)
(path)
1
destacada *
boolean
(query)

true
Execute
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "string",
  "imagenUrl": "string",
  "posicionImagen": "string",
  "categoria": "string",
  "etiquetas": [
    "string"
  ],
  "autor": "string",
  "estado": "BORRADOR",
  "destacada": true,
  "fechaCreacion": "2026-07-14T05:05:19.828Z"
}
No links

PATCH
/api/v1/publicaciones/videos/{id}/ocultar
Ocultar video


Parameters
Try it out
Name	Description
id *
integer($int64)
(path)
id
Responses
Code	Description	Links
200	
OK

No links

POST
/api/v1/publicaciones
Crear publicacion


Parameters
Cancel
Reset
No parameters

Request body

application/json
{
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "stringhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
  "imagenUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0TzpUNpB0aQSzSpbBw2C1QIuCPfvIRJvYBo540762Xw&s=10",
  "posicionImagen": "ARRIBA",
  "categoriaId": 1,
  "etiquetasIds": [
    0
  ],
  "destacada": true
}
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJ1c2VySWQiOjEsInJvbCI6IkFETUlOSVNUUkFET1IiLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc4NDAwMzgzNiwiZXhwIjoxNzg0MDkwMjM2fQ.J1Gdw0kIXuqxh6Qt71tOZMvMiINDDFG5iw3U4-MKCHvakRcODpA18SMtzInKsHS-' \
  -H 'Content-Type: application/json' \
  -d '{
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "stringhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
  "imagenUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0TzpUNpB0aQSzSpbBw2C1QIuCPfvIRJvYBo540762Xw&s=10",
  "posicionImagen": "ARRIBA",
  "categoriaId": 1,
  "etiquetasIds": [
    0
  ],
  "destacada": true
}'
Request URL
http://localhost:8080/api/v1/publicaciones
Server response
Code	Details
200	
Response body
Download
{
  "id": 2,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "stringhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
  "imagenUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0TzpUNpB0aQSzSpbBw2C1QIuCPfvIRJvYBo540762Xw&s=10",
  "posicionImagen": "ARRIBA",
  "categoria": "galeria",
  "etiquetas": [],
  "autor": "admin",
  "estado": "BORRADOR",
  "destacada": true,
  "fechaCreacion": "2026-07-14T00:01:17.4577648"
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:01:17 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "string",
  "imagenUrl": "string",
  "posicionImagen": "string",
  "categoria": "string",
  "etiquetas": [
    "string"
  ],
  "autor": "string",
  "estado": "BORRADOR",
  "destacada": true,
  "fechaCreacion": "2026-07-14T05:05:19.842Z"
}
No links

POST
/api/v1/publicaciones/{id}/reacciones
Reaccionar a una publicacion

Suma 1 al contador del emoji indicado. Publico, no requiere sesion. Evitar reacciones repetidas del mismo dispositivo es responsabilidad del frontend.

Parameters
Cancel
Name	Description
id *
integer($int64)
(path)
2
emoji *
string
(query)
💀
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones/2/reacciones?emoji=%F0%9F%92%80' \
  -H 'accept: application/json' \
  -d ''
Request URL
http://localhost:8080/api/v1/publicaciones/2/reacciones?emoji=%F0%9F%92%80
Server response
Code	Details
200	
Response body
Download
{
  "emoji": "💀",
  "contador": 1
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:05:02 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "emoji": "string",
  "contador": 0
}
No links

POST
/api/v1/publicaciones/{id}/publicar
Publicar contenido


Parameters
Cancel
Name	Description
id *
integer($int64)
(path)
2
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones/2/publicar' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJ1c2VySWQiOjEsInJvbCI6IkFETUlOSVNUUkFET1IiLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc4NDAwMzgzNiwiZXhwIjoxNzg0MDkwMjM2fQ.J1Gdw0kIXuqxh6Qt71tOZMvMiINDDFG5iw3U4-MKCHvakRcODpA18SMtzInKsHS-' \
  -d ''
Request URL
http://localhost:8080/api/v1/publicaciones/2/publicar
Server response
Code	Details
200	
Response body
Download
{
  "id": 2,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "stringhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
  "imagenUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0TzpUNpB0aQSzSpbBw2C1QIuCPfvIRJvYBo540762Xw&s=10",
  "posicionImagen": "ARRIBA",
  "categoria": "galeria",
  "etiquetas": [],
  "autor": "admin",
  "estado": "PUBLICADA",
  "destacada": true,
  "fechaCreacion": "2026-07-14T00:01:17.457765"
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 05:01:38 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "string",
  "imagenUrl": "string",
  "posicionImagen": "string",
  "categoria": "string",
  "etiquetas": [
    "string"
  ],
  "autor": "string",
  "estado": "BORRADOR",
  "destacada": true,
  "fechaCreacion": "2026-07-14T05:05:19.866Z"
}
No links

POST
/api/v1/publicaciones/{id}/ocultar
Ocultar contenido


Parameters
Cancel
Name	Description
id *
integer($int64)
(path)
id
Execute
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "titulo": "string",
  "descripcionCorta": "string",
  "contenidoCompleto": "string",
  "imagenUrl": "string",
  "posicionImagen": "string",
  "categoria": "string",
  "etiquetas": [
    "string"
  ],
  "autor": "string",
  "estado": "BORRADOR",
  "destacada": true,
  "fechaCreacion": "2026-07-14T05:05:19.876Z"
}
No links

POST
/api/v1/publicaciones/videos
Publicar video


Parameters
Cancel
Reset
No parameters

Request body

application/json
{
  "titulo": "Ejemplo",
  "descripcion": "llllllllllllllllllllllllllll",
  "urlVideo": "https://youtu.be/zdfNMMowNnc?si=RkVaqUOKBIx-4K0P"
}
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones/videos' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJ1c2VySWQiOjEsInJvbCI6IkFETUlOSVNUUkFET1IiLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc4NDAwMzgzNiwiZXhwIjoxNzg0MDkwMjM2fQ.J1Gdw0kIXuqxh6Qt71tOZMvMiINDDFG5iw3U4-MKCHvakRcODpA18SMtzInKsHS-' \
  -H 'Content-Type: application/json' \
  -d '{
  "titulo": "Ejemplo",
  "descripcion": "llllllllllllllllllllllllllll",
  "urlVideo": "https://youtu.be/zdfNMMowNnc?si=RkVaqUOKBIx-4K0P"
}'
Request URL
http://localhost:8080/api/v1/publicaciones/videos
Server response
Code	Details
200	
Response body
Download
{
  "id": 1,
  "fechaCreacion": "2026-07-13T23:58:26.9957312",
  "fechaModificacion": "2026-07-13T23:58:26.9957312",
  "creadoPor": "admin",
  "modificadoPor": "admin",
  "titulo": "Ejemplo",
  "descripcion": "llllllllllllllllllllllllllll",
  "urlVideo": "https://youtu.be/zdfNMMowNnc?si=RkVaqUOKBIx-4K0P",
  "visible": true
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 04:58:27 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "fechaCreacion": "2026-07-14T05:05:19.890Z",
  "fechaModificacion": "2026-07-14T05:05:19.890Z",
  "creadoPor": "string",
  "modificadoPor": "string",
  "titulo": "string",
  "descripcion": "string",
  "urlVideo": "string",
  "visible": true
}
No links

POST
/api/v1/publicaciones/etiquetas
Crear etiqueta


Parameters
Cancel
Reset
No parameters

Request body

application/json
{
  "nombre": "galeria",
  "color": "blue"
}
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones/etiquetas' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJ1c2VySWQiOjEsInJvbCI6IkFETUlOSVNUUkFET1IiLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc4NDAwMzgzNiwiZXhwIjoxNzg0MDkwMjM2fQ.J1Gdw0kIXuqxh6Qt71tOZMvMiINDDFG5iw3U4-MKCHvakRcODpA18SMtzInKsHS-' \
  -H 'Content-Type: application/json' \
  -d '{
  "nombre": "galeria",
  "color": "blue"
}'
Request URL
http://localhost:8080/api/v1/publicaciones/etiquetas
Server response
Code	Details
200	
Response body
Download
{
  "id": 1,
  "fechaCreacion": "2026-07-13T23:55:44.3640045",
  "fechaModificacion": "2026-07-13T23:55:44.3640045",
  "creadoPor": "admin",
  "modificadoPor": "admin",
  "nombre": "galeria",
  "color": "blue"
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 04:55:44 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "fechaCreacion": "2026-07-14T05:05:19.900Z",
  "fechaModificacion": "2026-07-14T05:05:19.900Z",
  "creadoPor": "string",
  "modificadoPor": "string",
  "nombre": "string",
  "color": "string"
}
No links

POST
/api/v1/publicaciones/categorias
Crear categoria


Parameters
Cancel
Reset
No parameters

Request body

application/json
{
  "nombre": "galeria"
}
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'http://localhost:8080/api/v1/publicaciones/categorias' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJ1c2VySWQiOjEsInJvbCI6IkFETUlOSVNUUkFET1IiLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc4NDAwMzgzNiwiZXhwIjoxNzg0MDkwMjM2fQ.J1Gdw0kIXuqxh6Qt71tOZMvMiINDDFG5iw3U4-MKCHvakRcODpA18SMtzInKsHS-' \
  -H 'Content-Type: application/json' \
  -d '{
  "nombre": "galeria"
}'
Request URL
http://localhost:8080/api/v1/publicaciones/categorias
Server response
Code	Details
200	
Response body
Download
{
  "id": 1,
  "fechaCreacion": "2026-07-13T23:56:51.6185681",
  "fechaModificacion": "2026-07-13T23:56:51.6185681",
  "creadoPor": "admin",
  "modificadoPor": "admin",
  "nombre": "galeria"
}
Response headers
 cache-control: no-cache,no-store,max-age=0,must-revalidate 
 connection: keep-alive 
 content-type: application/json 
 date: Tue,14 Jul 2026 04:56:51 GMT 
 expires: 0 
 keep-alive: timeout=60 
 pragma: no-cache 
 transfer-encoding: chunked 
 vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers 
 x-content-type-options: nosniff 
 x-frame-options: SAMEORIGIN 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "fechaCreacion": "2026-07-14T05:05:19.910Z",
  "fechaModificacion": "2026-07-14T05:05:19.910Z",
  "creadoPor": "string",
  "modificadoPor": "string",
  "nombre": "string"
}