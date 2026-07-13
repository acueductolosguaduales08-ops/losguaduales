package com.acueducto.backend.service;

import com.acueducto.backend.config.StorageConfig;
import com.acueducto.backend.dto.request.ConfiguracionRequest;
import com.acueducto.backend.dto.request.MetodoPagoRequest;
import com.acueducto.backend.dto.response.ConfiguracionResponse;
import com.acueducto.backend.entity.ArchivoInstitucional;
import com.acueducto.backend.entity.Configuracion;
import com.acueducto.backend.entity.MetodoPago;
import com.acueducto.backend.entity.enums.TipoArchivoInstitucional;
import com.acueducto.backend.exception.RecursoNoEncontradoException;
import com.acueducto.backend.repository.ArchivoInstitucionalRepository;
import com.acueducto.backend.repository.ConfiguracionRepository;
import com.acueducto.backend.repository.MetodoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Modulo de Parametros del Sistema (Modulo 10). Centraliza informacion institucional,
 * tarifas, datos bancarios, metodos de pago y archivos institucionales (logo, firma, sello).
 */
@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ArchivoInstitucionalRepository archivoInstitucionalRepository;
    private final StorageConfig storageConfig;
    private final AuditoriaService auditoriaService;

    public ConfiguracionResponse obtener() {
        return ConfiguracionResponse.fromEntity(obtenerEntidad());
    }

    public Configuracion obtenerEntidad() {
        return configuracionRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RecursoNoEncontradoException("La configuracion del sistema aun no ha sido inicializada."));
    }

    @Transactional
    public ConfiguracionResponse actualizar(ConfiguracionRequest request) {
        Configuracion config = configuracionRepository.findAll().stream().findFirst()
                .orElseGet(() -> Configuracion.builder().build());

        config.setNombreAcueducto(request.nombreAcueducto());
        config.setNit(request.nit());
        config.setDireccion(request.direccion());
        config.setTelefonoPrincipal(request.telefonoPrincipal());
        config.setCorreo(request.correo());
        config.setMunicipio(request.municipio());
        config.setDepartamento(request.departamento());
        config.setBanco(request.banco());
        config.setTipoCuenta(request.tipoCuenta());
        config.setNumeroCuenta(request.numeroCuenta());
        config.setTitularCuenta(request.titularCuenta());
        config.setValorM3(request.valorM3());
        config.setCargoFijoAdministracion(request.cargoFijoAdministracion());
        config.setValorReconexion(request.valorReconexion());
        config.setValorMultaDefecto(request.valorMultaDefecto());
        if (request.diasPlazoPago() != null) config.setDiasPlazoPago(request.diasPlazoPago());
        config.setNotasFactura(request.notasFactura());

        config = configuracionRepository.save(config);
        auditoriaService.registrar("ACTUALIZAR_CONFIGURACION", "CONFIGURACION", "parametros_generales", null);
        return ConfiguracionResponse.fromEntity(config);
    }

    /** Numeracion consecutiva y atomica de facturas, recibos, entradas y salidas (4.9). */
    @Transactional
    public synchronized long siguienteNumeroFactura() {
        Configuracion config = obtenerEntidad();
        long numero = config.getSiguienteNumeroFactura();
        config.setSiguienteNumeroFactura(numero + 1);
        configuracionRepository.save(config);
        return numero;
    }

    @Transactional
    public synchronized long siguienteNumeroRecibo() {
        Configuracion config = obtenerEntidad();
        long numero = config.getSiguienteNumeroRecibo();
        config.setSiguienteNumeroRecibo(numero + 1);
        configuracionRepository.save(config);
        return numero;
    }

    // ---- Metodos de pago ----

    @Transactional
    public MetodoPago crearMetodoPago(MetodoPagoRequest request) {
        MetodoPago metodo = MetodoPago.builder().nombre(request.nombre()).activo(true).build();
        return metodoPagoRepository.save(metodo);
    }

    @Transactional
    public MetodoPago cambiarEstadoMetodoPago(Long id, boolean activo) {
        MetodoPago metodo = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Metodo de pago no encontrado"));
        metodo.setActivo(activo);
        return metodoPagoRepository.save(metodo);
    }

    public List<MetodoPago> listarMetodosPagoActivos() {
        return metodoPagoRepository.findByActivoTrue();
    }

    public List<MetodoPago> listarTodosMetodosPago() {
        return metodoPagoRepository.findAll();
    }

    // ---- Archivos institucionales (logo, firma, sello) ----

    @Transactional
    public ArchivoInstitucional subirArchivoInstitucional(TipoArchivoInstitucional tipo, MultipartFile archivo) {
        try {
            String carpeta = switch (tipo) {
                case LOGO -> "logo";
                case FIRMA -> "firma";
                case SELLO -> "sello";
            };
            Path directorio = Path.of(storageConfig.getConfigPath(), carpeta);
            Files.createDirectories(directorio);

            String marcaTiempo = java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String nombreArchivo = marcaTiempo + "_" + archivo.getOriginalFilename();
            Path destino = directorio.resolve(nombreArchivo);
            Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            String rutaRelativa = "/config/" + carpeta + "/" + nombreArchivo;

            ArchivoInstitucional entidad = ArchivoInstitucional.builder()
                    .tipo(tipo).nombreArchivo(nombreArchivo).ruta(rutaRelativa).activo(false)
                    .build();
            entidad = archivoInstitucionalRepository.save(entidad);

            auditoriaService.registrar("SUBIR_ARCHIVO_INSTITUCIONAL", "CONFIGURACION", nombreArchivo, tipo.name());
            return entidad;
        } catch (IOException e) {
            throw new RuntimeException("No fue posible guardar el archivo institucional", e);
        }
    }

    /** Selecciona el archivo activo de un tipo sin necesidad de modificar el codigo (10.10). */
    @Transactional
    public void activarArchivoInstitucional(Long archivoId) {
        ArchivoInstitucional archivo = archivoInstitucionalRepository.findById(archivoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Archivo institucional no encontrado"));

        archivoInstitucionalRepository.findByTipo(archivo.getTipo())
                .forEach(a -> {
                    a.setActivo(a.getId().equals(archivoId));
                    archivoInstitucionalRepository.save(a);
                });

        Configuracion config = configuracionRepository.findAll().stream().findFirst()
                .orElseGet(() -> Configuracion.builder().build());
        switch (archivo.getTipo()) {
            case LOGO -> config.setLogoActivo(archivo.getRuta());
            case FIRMA -> config.setFirmaActiva(archivo.getRuta());
            case SELLO -> config.setSelloActivo(archivo.getRuta());
        }
        configuracionRepository.save(config);

        auditoriaService.registrar("ACTIVAR_ARCHIVO_INSTITUCIONAL", "CONFIGURACION", archivo.getNombreArchivo(), archivo.getTipo().name());
    }

    public List<ArchivoInstitucional> listarArchivosPorTipo(TipoArchivoInstitucional tipo) {
        return archivoInstitucionalRepository.findByTipo(tipo);
    }

    /**
     * Registra en la base de datos cualquier imagen que ya haya sido colocada directamente
     * en la carpeta de almacenamiento del servidor (storage/config/logo|firma|sello), sin
     * necesidad de subirla por la API. Util cuando la subida por formulario no es viable:
     * basta con copiar el archivo al servidor y llamar a este metodo (o pulsar
     * "Actualizar lista" en el panel) para que quede disponible y seleccionable.
     */
    @Transactional
    public List<ArchivoInstitucional> sincronizarCarpeta(TipoArchivoInstitucional tipo) {
        String carpeta = switch (tipo) {
            case LOGO -> "logo";
            case FIRMA -> "firma";
            case SELLO -> "sello";
        };
        Path directorio = Path.of(storageConfig.getConfigPath(), carpeta);

        try {
            Files.createDirectories(directorio);
            List<ArchivoInstitucional> existentes = archivoInstitucionalRepository.findByTipo(tipo);
            java.util.Set<String> nombresYaRegistrados = existentes.stream()
                    .map(ArchivoInstitucional::getNombreArchivo)
                    .collect(java.util.stream.Collectors.toSet());

            try (var stream = Files.list(directorio)) {
                stream.filter(Files::isRegularFile)
                        .filter(p -> esImagen(p.getFileName().toString()))
                        .filter(p -> !nombresYaRegistrados.contains(p.getFileName().toString()))
                        .forEach(p -> {
                            ArchivoInstitucional nuevo = ArchivoInstitucional.builder()
                                    .tipo(tipo)
                                    .nombreArchivo(p.getFileName().toString())
                                    .ruta("/config/" + carpeta + "/" + p.getFileName())
                                    .activo(false)
                                    .build();
                            archivoInstitucionalRepository.save(nuevo);
                            auditoriaService.registrar("SINCRONIZAR_ARCHIVO_INSTITUCIONAL", "CONFIGURACION",
                                    nuevo.getNombreArchivo(), tipo.name());
                        });
            }
            return archivoInstitucionalRepository.findByTipo(tipo);
        } catch (IOException e) {
            throw new RuntimeException("No fue posible leer la carpeta de archivos institucionales: " + directorio, e);
        }
    }

    private boolean esImagen(String nombreArchivo) {
        String n = nombreArchivo.toLowerCase();
        return n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".webp") || n.endsWith(".svg");
    }
}
