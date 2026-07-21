import { useEffect, useState } from 'react';
import { X, Loader2, ShieldAlert, FileText } from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import AsociadoPicker from './AsociadoPicker';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

// Modal para registrar una multa (POST /api/v1/tesoreria/multas).
// La factura relacionada es opcional; si se indica, se sugiere desde las facturas del asociado.
export default function RegistrarMultaModal({ open, onClose, onSaved }) {
  const { toast } = useToast();
  const [asociado, setAsociado] = useState(null);
  const [facturasAsociado, setFacturasAsociado] = useState([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const [facturaId, setFacturaId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAsociado(null);
      setFacturasAsociado([]);
      setFacturaId(null);
      setMotivo('');
      setValor('');
    }
  }, [open]);

  useEffect(() => {
    if (!asociado) {
      setFacturasAsociado([]);
      setFacturaId(null);
      return;
    }
    setCargandoFacturas(true);
    FacturasAPI.listarPorAsociado(asociado.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setFacturasAsociado(lista.filter((f) => f.estado !== 'ANULADA'));
      })
      .catch(() => setFacturasAsociado([]))
      .finally(() => setCargandoFacturas(false));
  }, [asociado]);

  const isDirty = Boolean(asociado || motivo.trim() || valor);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asociado) {
      toast('Selecciona el asociado a multar.', 'warning');
      return;
    }
    if (!motivo.trim()) {
      toast('El motivo de la multa es obligatorio.', 'warning');
      return;
    }
    if (!valor || Number(valor) <= 0) {
      toast('El valor debe ser mayor a 0.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await TesoreriaAPI.registrarMulta({
        asociadoId: asociado.id,
        facturaId: facturaId || undefined,
        motivo: motivo.trim(),
        valor: Number(valor),
      });
      toast('Multa registrada correctamente.', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo registrar la multa.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Registrar multa
          </h3>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Asociado <span className="text-red-500">*</span>
            </label>
            <AsociadoPicker value={asociado} onChange={setAsociado} autoFocus />
          </div>

          {asociado && (
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Factura relacionada <span className="text-gray-400">(opcional)</span>
              </label>
              {cargandoFacturas ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando facturas…
                </div>
              ) : facturasAsociado.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Este asociado no tiene facturas registradas.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setFacturaId(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      !facturaId
                        ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                        : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    Sin factura relacionada
                  </button>
                  {facturasAsociado.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFacturaId(f.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-between gap-2 ${
                        facturaId === f.id
                          ? 'bg-brand border-brand text-white'
                          : 'border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 hover:border-brand'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" /> {f.numeroFactura}
                      </span>
                      <span className="shrink-0">{formatCOP(f.total)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Describa el motivo de la multa"
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
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

          <div className="pt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar multa
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
