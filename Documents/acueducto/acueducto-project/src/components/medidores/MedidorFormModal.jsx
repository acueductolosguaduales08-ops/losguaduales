import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MedidoresAPI } from '../../api/medidores';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

const initialForm = {
  numero: '',
  fechaInstalacion: '',
  ubicacion: '',
  asociadoId: '',
  observaciones: '',
};

// Modal de creación / edición de medidor (POST /api/v1/medidores, PUT /api/v1/medidores/{id}).
export default function MedidorFormModal({ open, medidor, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [asociados, setAsociados] = useState([]);
  const [buscando, setBuscando] = useState('');

  const esEdicion = !!medidor;
  const baselineRef = useRef(initialForm);

  useEffect(() => {
    if (!open) return;
    const base = medidor
      ? {
          numero: medidor.numero || '',
          fechaInstalacion: medidor.fechaInstalacion || '',
          ubicacion: medidor.ubicacion || '',
          asociadoId: medidor.asociadoId ? String(medidor.asociadoId) : '',
          observaciones: '',
        }
      : initialForm;
    setForm(base);
    baselineRef.current = base;
  }, [open, medidor]);

  useEffect(() => {
    if (!open) return;
    AsociadosAPI.buscar(buscando || undefined)
      .then((data) => setAsociados(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setAsociados([]));
  }, [open, buscando]);

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero.trim()) {
      toast('El número de serie del medidor es obligatorio.', 'warning');
      return;
    }

    const payload = {
      numero: form.numero.trim(),
      asociadoId: form.asociadoId ? Number(form.asociadoId) : null,
      fechaInstalacion: form.fechaInstalacion || null,
      ubicacion: form.ubicacion || null,
      observaciones: form.observaciones || null,
    };

    setSubmitting(true);
    try {
      if (esEdicion) {
        await MedidoresAPI.editar(medidor.id, payload);
        toast('Medidor actualizado correctamente.', 'success');
      } else {
        await MedidoresAPI.crear(payload);
        toast('Medidor registrado correctamente.', 'success');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo guardar el medidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {esEdicion ? 'Editar medidor' : 'Registrar nuevo medidor'}
          </h3>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto overscroll-contain custom-scroll">
          <div>
            <label className={labelCls}>
              Número de medidor (serie) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.numero}
              onChange={handleChange('numero')}
              placeholder="Ingrese el número de medidor"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha instalación</label>
              <input
                type="date"
                value={form.fechaInstalacion}
                onChange={handleChange('fechaInstalacion')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <div>
              <label className={labelCls}>Ubicación</label>
              <input
                type="text"
                value={form.ubicacion}
                onChange={handleChange('ubicacion')}
                placeholder="Ingrese la ubicación"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Asociado (opcional al registrar)</label>
            <select value={form.asociadoId} onChange={handleChange('asociadoId')} className={inputCls}>
              <option value="">-- Ninguno (registrar primero, asociar después) --</option>
              {asociados.map((a) => (
                <option key={a.id} value={a.id}>
                  ID {a.id} - {a.nombres} {a.apellidos}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={buscando}
              onChange={(e) => setBuscando(e.target.value)}
              placeholder="Buscar asociado por nombre o documento…"
              className={`${inputCls} mt-2 text-xs`}
            />
          </div>

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              placeholder="Detalles del estado inicial, notas técnicas…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </form>

        <div className="p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={requestClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Guardar medidor'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
