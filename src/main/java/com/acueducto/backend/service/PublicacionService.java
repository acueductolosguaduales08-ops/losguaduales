package com.acueducto.backend.service;

import com.acueducto.backend.dto.request.CategoriaRequest;
import com.acueducto.backend.dto.request.EtiquetaRequest;
import com.acueducto.backend.dto.request.PublicacionRequest;
import com.acueducto.backend.dto.request.VideoRequest;
import com.acueducto.backend.dto.response.PublicacionResponse;
import com.acueducto.backend.entity.*;
import com.acueducto.backend.entity.enums.EstadoPublicacion;
import com.acueducto.backend.exception.RecursoNoEncontradoException;
import com.acueducto.backend.exception.ReglaNegocioException;
import com.acueducto.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Modulo del Portal Publico: galeria, publicaciones destacadas, categorias, etiquetas y videos (Modulo 11). */
@Service
@RequiredArgsConstructor
public class PublicacionService {

    private final PublicacionRepository publicacionRepository;
    private final CategoriaRepository categoriaRepository;
    private final EtiquetaRepository etiquetaRepository;
    private final VideoRepository videoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    @Transactional
    public PublicacionResponse crear(PublicacionRequest request, String autorUsername) {
        Usuario autor = usuarioRepository.findByUsernameIgnoreCase(autorUsername)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        Categoria categoria = null;
        if (request.categoriaId() != null) {
            categoria = categoriaRepository.findById(request.categoriaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Categoria no encontrada"));
        }

        Set<Etiqueta> etiquetas = new HashSet<>();
        if (request.etiquetasIds() != null) {
            etiquetas.addAll(etiquetaRepository.findAllById(request.etiquetasIds()));
        }

        Publicacion publicacion = Publicacion.builder()
                .titulo(request.titulo())
                .descripcionCorta(request.descripcionCorta())
                .contenidoCompleto(request.contenidoCompleto())
                .imagenUrl(request.imagenUrl())
                .posicionImagen(request.posicionImagen())
                .categoria(categoria)
                .etiquetas(etiquetas)
                .autor(autor)
                .estado(EstadoPublicacion.BORRADOR)
                .destacada(request.destacada())
                .build();

        publicacion = publicacionRepository.save(publicacion);
        auditoriaService.registrar("CREAR_PUBLICACION", "PORTAL_PUBLICO", publicacion.getTitulo(), null);
        return PublicacionResponse.fromEntity(publicacion);
    }

    @Transactional
    public PublicacionResponse publicar(Long id) {
        Publicacion publicacion = obtenerEntidad(id);
        publicacion.setEstado(EstadoPublicacion.PUBLICADA);
        publicacion = publicacionRepository.save(publicacion);
        auditoriaService.registrar("PUBLICAR_CONTENIDO", "PORTAL_PUBLICO", publicacion.getTitulo(), null);
        return PublicacionResponse.fromEntity(publicacion);
    }

    @Transactional
    public PublicacionResponse ocultar(Long id) {
        Publicacion publicacion = obtenerEntidad(id);
        publicacion.setEstado(EstadoPublicacion.OCULTA);
        publicacion = publicacionRepository.save(publicacion);
        return PublicacionResponse.fromEntity(publicacion);
    }

    @Transactional
    public PublicacionResponse destacar(Long id, boolean destacada) {
        Publicacion publicacion = obtenerEntidad(id);
        publicacion.setDestacada(destacada);
        publicacion = publicacionRepository.save(publicacion);
        return PublicacionResponse.fromEntity(publicacion);
    }

    /** Solo el Administrador puede eliminar definitivamente una publicacion (11.10). */
    @Transactional
    public void eliminar(Long id) {
        Publicacion publicacion = obtenerEntidad(id);
        publicacionRepository.delete(publicacion);
        auditoriaService.registrar("ELIMINAR_PUBLICACION", "PORTAL_PUBLICO", publicacion.getTitulo(), null);
    }

    public Publicacion obtenerEntidad(Long id) {
        return publicacionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Publicacion no encontrada con id " + id));
    }

    public Page<PublicacionResponse> listarPublicadas(Pageable pageable) {
        return publicacionRepository.findByEstado(EstadoPublicacion.PUBLICADA, pageable).map(PublicacionResponse::fromEntity);
    }

    public List<PublicacionResponse> listarDestacadas() {
        return publicacionRepository.findByEstadoAndDestacadaTrue(EstadoPublicacion.PUBLICADA).stream()
                .map(PublicacionResponse::fromEntity).toList();
    }

    // ---- Categorias ----
    @Transactional
    public Categoria crearCategoria(CategoriaRequest request) {
        return categoriaRepository.save(Categoria.builder().nombre(request.nombre()).build());
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    // ---- Etiquetas ----
    @Transactional
    public Etiqueta crearEtiqueta(EtiquetaRequest request) {
        return etiquetaRepository.save(Etiqueta.builder().nombre(request.nombre()).color(request.color()).build());
    }

    public List<Etiqueta> listarEtiquetas() {
        return etiquetaRepository.findAll();
    }

    // ---- Videos ----
    @Transactional
    public Video crearVideo(VideoRequest request) {
        Video video = Video.builder()
                .titulo(request.titulo()).descripcion(request.descripcion()).urlVideo(request.urlVideo()).visible(true)
                .build();
        return videoRepository.save(video);
    }

    public List<Video> listarVideosVisibles() {
        return videoRepository.findByVisibleTrue();
    }

    @Transactional
    public void ocultarVideo(Long id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Video no encontrado"));
        video.setVisible(false);
        videoRepository.save(video);
    }
}
