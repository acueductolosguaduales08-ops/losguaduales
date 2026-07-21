import { useEffect, useState } from 'react';
import { X, Loader2, PlusCircle } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';

// Modal para agregar un concepto adicional a una factura (POST /api/v1/facturas/conceptos).
export default function ConceptoAdicionalModal({ open, factura, onClose, onSaved }) {
  const { toast } = useToast();
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDescripcion('');
      setValor('');
    }
  }, [open]);

  if (!open || !factura) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      toast('La descripción del concepto es obligatoria.', 'warning');
      return;
    }
    if (!valor || Number(valor) <= 0) {
      toast('El valor debe ser mayor a 0.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await FacturasAPI.agregarConcepto({
        facturaId: factura.id,
        descripcion: descripcion.trim(),
        valor: Number(valor),
      });
      toast('Concepto adicional agregado a la factura.', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo agregar el concepto.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand" /> Concepto adicional
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se agregará a la factura <strong className="text-gray-800 dark:text-white">{factura.numeroFactura}</strong> de{' '}
            {factura.asociadoNombre}.
          </p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese el concepto"
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Valor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ingrese el valor"
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
