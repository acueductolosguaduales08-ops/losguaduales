# Prompt maestro para construir el frontend del sistema Acueducto

## Objetivo
Este documento es una guía de referencia para que una IA o un desarrollador pueda construir el frontend del proyecto sin omitir funcionalidades del backend. Debe usarse como fuente de verdad para definir pantallas, formularios, permisos, flujos, validaciones y respuestas esperadas.

## Instrucciones para la IA
- Conoce este proyecto como un sistema integral de gestión de acueducto.
- No inventes endpoints, campos ni reglas que no existan en el backend.
- Debes cubrir todos los módulos funcionales del sistema, no solo los más visibles.
- Siempre considera autenticación, roles, permisos, flujos públicos y privados.
- Si una acción tiene un endpoint backend, el frontend debería permitirla si corresponde al rol del usuario.
- Si un módulo es público, debe funcionar sin iniciar sesión.
- Si un módulo está restringido, el frontend debe mostrar mensajes claros de acceso denegado y redirigir o bloquear la acción.
- Debes manejar correctamente respuestas como 401, 403, 404, 422 y 500.
- Debes contemplar paginación, filtros, búsquedas, descargas en HTML/PDF y visualización de QR donde aplique.
- Debes respetar reglas de negocio del backend, especialmente las de facturación, tesorería, periodos contables y seguridad.

---

## Resumen del sistema
Backend REST en Java 17 + Spring Boot 3.3, con:
- Seguridad por JWT
- Roles: ASOCIADO, TESORERO, ADMINISTRADOR
- Persistencia con Spring Data JPA / PostgreSQL en producción y H2 en desarrollo
- Documentación OpenAPI / Swagger
- Generación de PDFs y QR

## Base de la API
- URL base esperada: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## Autenticación y seguridad
### Roles del sistema
- Público: sin sesión, solo puede ver contenido público, consultar estado de servicio y responder formularios públicos.
- Asociado: solo puede ver su propia información personal y financiera.
- Tesorero: gestiona asociados, lecturas (solo lectura), pagos, multas, gastos, facturación, notificaciones, encuestas y reportes.
- Administrador: acceso total, incluyendo configuración, periodos, auditoria y eliminación definitiva de recursos.

### Endpoints de autenticación
- POST /api/v1/auth/login
  - Body: { "username": "", "password": "" }
  - Respuesta: accessToken, refreshToken, tokenType, expiresInMs, usuario
- POST /api/v1/auth/refresh
  - Body: { "refreshToken": "" }
- POST /api/v1/auth/logout
  - Requiere JWT
- POST /api/v1/auth/usuarios
  - Solo ADMIN/TESORERO
  - Body: username, password, email, rol, asociadoId
- GET /api/v1/auth/perfil
  - Requiere JWT
- PUT /api/v1/auth/cambiar-password
  - Requiere JWT

### Reglas de seguridad importantes
- El frontend debe guardar el JWT en memoria o almacenamiento seguro y enviarlo en Authorization: Bearer <token>.
- Las rutas públicas deben funcionar sin login.
- Los asociados no pueden acceder a datos de otros asociados.
- El backend usa filtros globales y validaciones por rol en cada controlador.

---

## Módulos y endpoints

### 1) Asociados
Base: /api/v1/asociados

Endpoints:
- POST /api/v1/asociados
  - Crear asociado
  - Solo ADMIN/TESORERO
  - Body requerido: tipoDocumento, documento, nombres, apellidos, telefonoPrincipal, direccion, numeroMedidor
- PUT /api/v1/asociados/{id}
  - Editar asociado
  - Solo ADMIN/TESORERO
- GET /api/v1/asociados?q=...
  - Buscar/listar asociados
  - Puede filtrar por documento, nombre, apellidos o teléfono
- GET /api/v1/asociados/filtrar?estado=...
  - Filtrar por estado de servicio: ACTIVO, SUSPENDIDO, INACTIVO
- GET /api/v1/asociados/{id}
  - Detalle de asociado
- GET /api/v1/asociados/{id}/resumen-financiero
  - Resumen financiero del asociado
- PATCH /api/v1/asociados/{id}/estado-servicio
  - Cambiar estado de servicio
- DELETE /api/v1/asociados/{id}
  - Archivar asociado (baja lógica)

Campos de entrada recomendados para formularios:
- tipoDocumento: CC, CE, TI, NIT, PASAPORTE
- documento
- nombres
- apellidos
- fechaNacimiento
- telefonoPrincipal
- telefonoAlternativo
- correo
- direccion
- barrioVereda
- observaciones
- numeroMedidor
- fechaAfiliacion

Campos de salida esperados:
- id, codigoInterno, tipoDocumento, documento, nombres, apellidos, telefonoPrincipal, telefonoAlternativo, correo, direccion, barrioVereda, estadoServicio, fechaAfiliacion, numeroMedidor, archivado

### 2) Medidores
Base: /api/v1/medidores

Endpoints:
- POST /api/v1/medidores
- PUT /api/v1/medidores/{id}
- PATCH /api/v1/medidores/{id}/estado?estado=...
- GET /api/v1/medidores
- GET /api/v1/medidores/{id}

Campos relevantes:
- numero
- asociadoId
- fechaInstalacion
- ubicacion
- observaciones

### 3) Lecturas y consumo
Base: /api/v1/lecturas

Endpoints:
- POST /api/v1/lecturas
  - Registra lectura del medidor
  - El consumo se calcula automáticamente como lecturaActual - lecturaAnterior
- PUT /api/v1/lecturas/{id}
  - Editar lectura solo si no ha generado factura
- GET /api/v1/lecturas/{id}
- GET /api/v1/lecturas/asociado/{asociadoId}
- GET /api/v1/lecturas/mes/{mesContableId}

Campos de entrada:
- medidorId
- mesContableId
- fechaLectura
- lecturaActual
- observaciones

Reglas de negocio:
- El consumo nunca puede ser negativo.
- El consumo se calcula en backend, no en el frontend.

### 4) Periodos contables
Base: /api/v1/periodos

Endpoints:
- POST /api/v1/periodos/anios
- GET /api/v1/periodos/anios
- POST /api/v1/periodos/meses
- GET /api/v1/periodos/anios/{anioId}/meses
- POST /api/v1/periodos/meses/{mesId}/cerrar
- POST /api/v1/periodos/meses/{mesId}/reabrir
- GET /api/v1/periodos/meses/{mesId}/resumen

Notas:
- Un periodo no puede cerrarse si existen lecturas sin factura generada.
- El frontend debe impedir cerrar un mes que no cumpla estas reglas.

### 5) Configuración del sistema
Base: /api/v1/configuracion

Endpoints:
- GET /api/v1/configuracion
- PUT /api/v1/configuracion
- POST /api/v1/configuracion/metodos-pago
- PATCH /api/v1/configuracion/metodos-pago/{id}?activo=true/false
- GET /api/v1/configuracion/metodos-pago
- POST /api/v1/configuracion/archivos/{tipo}
  - tipo: LOGO, FIRMA, SELLO (o equivalente según el enum del backend)
  - usa multipart/form-data con archivo
- PATCH /api/v1/configuracion/archivos/{archivoId}/activar
- GET /api/v1/configuracion/archivos/{tipo}
- POST /api/v1/configuracion/archivos/{tipo}/sincronizar

Campos de configuración relevantes:
- nombreAcueducto
- nit
- direccion
- telefonoPrincipal
- correo
- municipio
- departamento
- banco
- tipoCuenta
- numeroCuenta
- titularCuenta
- valorM3
- cargoFijoAdministracion
- valorReconexion
- valorMultaDefecto
- diasPlazoPago
- notasFactura

Regla importante:
- Cambios de tarifa solo afectan facturas nuevas, no las existentes.

### 6) Facturación
Base: /api/v1/facturas

Endpoints:
- POST /api/v1/facturas/generar-mes
- POST /api/v1/facturas/conceptos
- POST /api/v1/facturas/{id}/anular?motivo=...
- GET /api/v1/facturas/{id}
- GET /api/v1/facturas/asociado/{asociadoId}
- GET /api/v1/facturas?estado=...
- GET /api/v1/facturas/todas
- GET /api/v1/facturas/{id}/html
- GET /api/v1/facturas/{id}/pdf
- GET /api/v1/facturas/qr/{numeroFactura}

Campos de salida esperados:
- id, numeroFactura, asociadoId, asociadoNombre, numeroMedidor, fechaEmision, fechaLimitePago, lecturaAnterior, lecturaActual, consumoM3, valorConsumo, cargoAdministracion, valoresAdicionales, totalMultas, total, totalPagado, saldoPendiente, estado, codigoQr

Estados de factura:
- PENDIENTE
- PAGADA_PARCIAL
- PAGADA
- VENCIDA
- ANULADA

Reglas de negocio:
- La generación de facturas se hace a partir de las lecturas pendientes de un mes.
- El frontend debe permitir ver, descargar e incluso anular facturas.
- El saldo pendiente es central para la experiencia de pago.

### 7) Tesorería
Base: /api/v1/tesoreria

Endpoints:
- POST /api/v1/tesoreria/pagos
  - Registra pago de factura
  - Operación atómica: actualiza factura, crea movimiento, genera recibo y notifica al asociado
- POST /api/v1/tesoreria/multas
- GET /api/v1/tesoreria/multas/asociado/{asociadoId}
- POST /api/v1/tesoreria/ingresos
- POST /api/v1/tesoreria/gastos
- POST /api/v1/tesoreria/movimientos/{id}/anular?motivo=...
- GET /api/v1/tesoreria/movimientos?tipo=...
- GET /api/v1/tesoreria/movimientos/todos
- GET /api/v1/tesoreria/caja-diaria

Campos de pago:
- facturaId
- valor
- metodoPagoId
- observaciones

Reglas de negocio:
- No se puede pagar más del saldo pendiente.
- El pago genera automáticamente un recibo.
- El frontend debe mostrar validaciones claras antes de registrar un pago.

### 8) Recibos
Base: /api/v1/recibos

Endpoints:
- GET /api/v1/recibos/asociado/{asociadoId}
- GET /api/v1/recibos/{numeroRecibo}/html
- GET /api/v1/recibos/{numeroRecibo}/pdf
- GET /api/v1/recibos/qr/{numeroRecibo}

### 9) Informes
Base: /api/v1/informes

Endpoints:
- GET /api/v1/informes/periodo/mes/{mesContableId}
- GET /api/v1/informes/periodo/mes/{mesContableId}/html
- GET /api/v1/informes/periodo/mes/{mesContableId}/pdf
- GET /api/v1/informes/periodo/anio/{anioContableId}
- GET /api/v1/informes/periodo/anio/{anioContableId}/html
- GET /api/v1/informes/periodo/anio/{anioContableId}/pdf
- GET /api/v1/informes/asociado/{asociadoId}
- GET /api/v1/informes/asociado/{asociadoId}/html
- GET /api/v1/informes/asociado/{asociadoId}/pdf

### 10) Encuestas y formularios
Base: /api/v1/encuestas

Endpoints:
- POST /api/v1/encuestas
- POST /api/v1/encuestas/{id}/activar
- POST /api/v1/encuestas/{id}/desactivar
- DELETE /api/v1/encuestas/{id}
- GET /api/v1/encuestas/admin
- GET /api/v1/encuestas/{id}/estadisticas
- GET /api/v1/encuestas/publicas
- GET /api/v1/encuestas/codigo/{codigo}
- GET /api/v1/encuestas/{id}
- POST /api/v1/encuestas/{id}/responder

Campos de creación:
- titulo
- descripcion
- publico
- requiereAutenticacion
- respuestaUnica
- respuestasAnonimas
- fechaInicio
- fechaFin
- preguntas: cada pregunta con texto, tipo, opciones, etc.

### 11) Notificaciones
Base: /api/v1/notificaciones

Endpoints:
- POST /api/v1/notificaciones
- GET /api/v1/notificaciones/publicas
- GET /api/v1/notificaciones/mis-notificaciones
- PATCH /api/v1/notificaciones/{id}/leida
- DELETE /api/v1/notificaciones/{id}

### 12) Publicaciones, categorías, etiquetas, videos y reacciones
Base: /api/v1/publicaciones

Endpoints:
- POST /api/v1/publicaciones
- POST /api/v1/publicaciones/{id}/publicar
- POST /api/v1/publicaciones/{id}/ocultar
- PATCH /api/v1/publicaciones/{id}/destacar?destacada=true/false
- DELETE /api/v1/publicaciones/{id}
- GET /api/v1/publicaciones/publicas
- GET /api/v1/publicaciones/destacadas
- POST /api/v1/publicaciones/categorias
- GET /api/v1/publicaciones/categorias
- POST /api/v1/publicaciones/etiquetas
- GET /api/v1/publicaciones/etiquetas
- POST /api/v1/publicaciones/videos
- GET /api/v1/publicaciones/videos/publicos
- PATCH /api/v1/publicaciones/videos/{id}/ocultar
- GET /api/v1/publicaciones/{id}/reacciones
- POST /api/v1/publicaciones/{id}/reacciones?emoji=...
- DELETE /api/v1/publicaciones/{id}/reacciones?emoji=...

### 13) Consultas públicas
Base: /api/v1/consultas

Endpoint:
- GET /api/v1/consultas/estado-servicio?documento=...

### 14) Auditoría
Base: /api/v1/auditoria

Endpoints:
- GET /api/v1/auditoria
- GET /api/v1/auditoria/modulo/{modulo}
- GET /api/v1/auditoria/usuario/{usuario}
- GET /api/v1/auditoria/estado
- PATCH /api/v1/auditoria/desactivar?nombre=...
- PATCH /api/v1/auditoria/activar?nombre=...

### 15) Estadísticas / dashboard
Base: /api/v1/estadisticas

Endpoint:
- GET /api/v1/estadisticas/dashboard

---

## Flujos recomendados que el frontend debe cubrir
1. Login y gestión de perfil.
2. Registro y administración de asociados.
3. Registro de medidores y lecturas.
4. Creación de periodos contables y cierre de meses.
5. Generación y visualización de facturas.
6. Registro de pagos, multas, ingresos, gastos y consulta de caja diaria.
7. Generación de recibos y consultas por QR.
8. Gestión de publicaciones, categorías, etiquetas, videos y reacciones.
9. Gestión de encuestas públicas y respuestas.
10. Gestión de notificaciones personales y públicas.
11. Consulta pública de estado de servicio por documento.
12. Reportes e informes en HTML/PDF.
13. Panel de estadísticas y auditoría administrativa.

---

## Reglas de negocio críticas que el frontend debe respetar
- El consumo se calcula en backend: lecturaActual - lecturaAnterior.
- Un asociado nunca se elimina físicamente si tiene historial; se archiva.
- Cambios de tarifa solo afectan facturas futuras.
- Un pago atómico genera recibo, actualiza factura y notifica al asociado.
- No se permite pagar más del saldo pendiente.
- Un periodo no puede cerrarse si hay lecturas sin factura.
- Toda acción relevante queda registrada en auditoría.
- Los QR apuntan a rutas públicas que deben integrarse en el frontend.

---

## Recomendaciones de UX para el frontend
- Mostrar menú diferenciado por rol.
- Ocultar opciones no permitidas según el rol autenticado.
- Mostrar estados de carga y mensajes de error claros.
- Usar paginación para listas largas.
- Soportar descarga de PDFs y visualización de HTML para documentos.
- Permitir subida de archivos institucionales (logo, firma, sello).
- Diseñar vistas públicas para consultas sin login.
- Incluir búsquedas, filtros y tablas con acciones rápidas.

---

## Resumen de datos de entrada más comunes
### Login
```json
{
  "username": "admin",
  "password": "Admin#2026"
}
```

### Asociado
```json
{
  "tipoDocumento": "CC",
  "documento": "123456789",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "telefonoPrincipal": "3001234567",
  "direccion": "Calle 10",
  "numeroMedidor": "M-001"
}
```

### Lectura
```json
{
  "medidorId": 1,
  "mesContableId": 1,
  "fechaLectura": "2026-07-01",
  "lecturaActual": 120,
  "observaciones": "Lectura mensual"
}
```

### Pago
```json
{
  "facturaId": 1,
  "valor": 150000,
  "metodoPagoId": 1,
  "observaciones": "Pago recibido"
}
```

### Encuesta
```json
{
  "titulo": "Encuesta de servicio",
  "publico": true,
  "requiereAutenticacion": false,
  "respuestaUnica": true,
  "respuestasAnonimas": true,
  "preguntas": []
}
```

---

## Criterio final
El frontend debe cubrir el sistema completo, no solo la parte operativa. La IA debe ser capaz de interpretar este backend como un sistema de gestión integral para acueducto y debe diseñar una interfaz que permita:
- gestionar usuarios y roles,
- operar asociados y medidores,
- controlar lecturas y facturación,
- registrar pagos y movimientos,
- publicar contenido y formularios,
- ofrecer experiencias públicas y privadas,
- generar documentos y reportes.

Si alguna funcionalidad del backend no se refleja en el frontend, el diseño está incompleto.
