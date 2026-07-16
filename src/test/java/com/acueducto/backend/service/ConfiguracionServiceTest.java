package com.acueducto.backend.service;

import com.acueducto.backend.config.StorageConfig;
import com.acueducto.backend.entity.ArchivoInstitucional;
import com.acueducto.backend.entity.enums.FuenteArchivoInstitucional;
import com.acueducto.backend.entity.enums.TipoArchivoInstitucional;
import com.acueducto.backend.repository.ArchivoInstitucionalRepository;
import com.acueducto.backend.repository.ConfiguracionRepository;
import com.acueducto.backend.repository.MetodoPagoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfiguracionServiceTest {

    @Mock
    private ConfiguracionRepository configuracionRepository;

    @Mock
    private MetodoPagoRepository metodoPagoRepository;

    @Mock
    private ArchivoInstitucionalRepository archivoInstitucionalRepository;

    @Mock
    private StorageConfig storageConfig;

    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private ConfiguracionService configuracionService;

    @Test
    void deberiaCrearArchivoInstitucionalDesdeUrl() {
        when(archivoInstitucionalRepository.save(any(ArchivoInstitucional.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArchivoInstitucional resultado = configuracionService.subirArchivoInstitucionalDesdeUrl(
                TipoArchivoInstitucional.LOGO,
                "https://example.com/logo.png",
                "logo.png"
        );

        assertNotNull(resultado);
        assertEquals(TipoArchivoInstitucional.LOGO, resultado.getTipo());
        assertEquals(FuenteArchivoInstitucional.URL, resultado.getFuente());
        assertEquals("https://example.com/logo.png", resultado.getRuta());
        assertEquals("logo.png", resultado.getNombreArchivo());
    }
}
