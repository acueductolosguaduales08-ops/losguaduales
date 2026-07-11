package com.acueducto.backend.service;

import com.acueducto.backend.entity.Configuracion;
import com.acueducto.backend.entity.Factura;
import com.acueducto.backend.entity.Recibo;
import com.acueducto.backend.util.PdfGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

/**
 * Renderiza facturas y recibos usando las plantillas Thymeleaf oficiales (7.9 / 8.12),
 * garantizando que la version HTML (consulta en linea) y la version PDF (descarga)
 * contengan exactamente la misma informacion (7.10 / 7.13 / 8.13).
 */
@Service
@RequiredArgsConstructor
public class DocumentoService {

    private final PdfGeneratorService pdfGeneratorService;
    private final ConfiguracionService configuracionService;

    public String renderizarFacturaHtml(Factura factura) {
        return pdfGeneratorService.renderizarHtml("factura", construirContextoFactura(factura));
    }

    public byte[] generarFacturaPdf(Factura factura) {
        return pdfGeneratorService.generarPdf("factura", construirContextoFactura(factura));
    }

    public String renderizarReciboHtml(Recibo recibo) {
        return pdfGeneratorService.renderizarHtml("recibo", construirContextoRecibo(recibo));
    }

    public byte[] generarReciboPdf(Recibo recibo) {
        return pdfGeneratorService.generarPdf("recibo", construirContextoRecibo(recibo));
    }

    private Context construirContextoFactura(Factura factura) {
        Configuracion config = configuracionService.obtenerEntidad();
        Context context = new Context();
        context.setVariable("factura", factura);
        context.setVariable("asociado", factura.getAsociado());
        context.setVariable("config", config);
        context.setVariable("conceptos", factura.getConceptos());
        return context;
    }

    private Context construirContextoRecibo(Recibo recibo) {
        Configuracion config = configuracionService.obtenerEntidad();
        Context context = new Context();
        context.setVariable("recibo", recibo);
        context.setVariable("pago", recibo.getPago());
        context.setVariable("factura", recibo.getFactura());
        context.setVariable("asociado", recibo.getAsociado());
        context.setVariable("config", config);
        return context;
    }
}
