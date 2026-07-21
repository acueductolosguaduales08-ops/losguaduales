import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AsociadosAPI, TIPOS_DOCUMENTO } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

const TIPO_DOC_LABEL = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  NIT: 'NIT',
  PASAPORTE: 'Pasaporte',
};

const initialForm = {
  tipoDocumento: 'CC',
  documento: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefonoPrincipal: '',
  telefonoAlternativo: '',
  correo: '',
  direccion: '',
  barrioVereda: '',
  observaciones: '',
  numeroMedidor: '',
  fechaAfiliacion: '',
};

// Modal de creación / edición de asociado (POST /api/v1/asociados, PUT /api/v1/asociados/{id}).
export default function AsociadoFormModal({ open, asociado, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const baselineRef = useRef(initialForm);

  const esEdicion = !!asociado;

  useEffect(() => {
    if (!open) return;
    const base = asociado
      ? {
          tipoDocumento: asociado.tipoDocumento || 'CC',
          documento: asociado.documento || '',
          nombres: asociado.nombres || '',
          apellidos: asociado.apellidos || '',
          fechaNacimiento: asociado.fechaNacimiento || '',
          telefonoPrincipal: asociado.telefonoPrincipal || '',
          telefonoAlternativo: asociado.telefonoAlternativo || '',
          correo: asociado.correo || '',
          direccion: asociado.direccion || '',
          barrioVereda: asociado.barrioVereda || '',
          observaciones: '',
          numeroMedidor: asociado.numeroMedidor || '',
          fechaAfiliacion: asociado.fechaAfiliacion || '',
        }
      : initialForm;
    setForm(base);
    baselineRef.current = base;
  }, [open, asociado]);

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.documento.trim() || !form.nombres.trim() || !form.apellidos.trim()) {
      toast('Documento, nombres y apellidos son obligatorios.', 'warning');
      return;
    }
    if (!form.telefonoPrincipal.trim()) {
      toast('El teléfono principal es obligatorio.', 'warning');
      return;
    }
    if (!form.direccion.trim()) {
      toast('La dirección es obligatoria.', 'warning');
      return;
    }
    if (!form.numeroMedidor.trim()) {
      toast('El número de medidor es obligatorio.', 'warning');
      return;
    }

    const payload = {
      tipoDocumento: form.tipoDocumento,
      documento: form.documento.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      telefonoPrincipal: form.telefonoPrincipal.trim(),
      telefonoAlternativo: form.telefonoAlternativo || null,
      correo: form.correo || null,
      direccion: form.direccion.trim(),
      barrioVereda: form.barrioVereda || null,
      observaciones: form.observaciones || null,
      numeroMedidor: form.numeroMedidor.trim(),
      fechaAfiliacion: form.fechaAfiliacion || null,
    };

    setSubmitting(true);
    try {
      if (esEdicion) {
        await AsociadosAPI.editar(asociado.id, payload);
        toast('Asociado actualizado correctamente.', 'success');
      } else {
        await AsociadosAPI.crear(payload);
        toast('Asociado registrado correctamente.', 'success');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo guardar el asociado.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {esEdicion ? 'Editar asociado' : 'Registrar nuevo asociado'}
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                Tipo doc. <span className="text-red-500">*</span>
              </label>
              <select value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} className={inputCls}>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t} — {TIPO_DOC_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>
                Número de documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.documento}
                onChange={handleChange('documento')}
                placeholder="Escriba el documento"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nombres}
                onChange={handleChange('nombres')}
                placeholder="Ingrese el nombre"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.apellidos}
                onChange={handleChange('apellidos')}
                placeholder="Ingrese el apellido"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Teléfono principal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.telefonoPrincipal}
                onChange={handleChange('telefonoPrincipal')}
                placeholder="Ingrese el teléfono"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Teléfono alternativo</label>
              <input
                type="text"
                value={form.telefonoAlternativo}
                onChange={handleChange('telefonoAlternativo')}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Correo</label>
              <input
                type="email"
                value={form.correo}
                onChange={handleChange('correo')}
                placeholder="Ingrese el correo"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={handleChange('fechaNacimiento')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.direccion}
                onChange={handleChange('direccion')}
                placeholder="Ingrese la dirección"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Barrio / Vereda</label>
              <input
                type="text"
                value={form.barrioVereda}
                onChange={handleChange('barrioVereda')}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Número de medidor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.numeroMedidor}
                onChange={handleChange('numeroMedidor')}
                placeholder="Ingrese el número de medidor"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de afiliación</label>
              <input
                type="date"
                value={form.fechaAfiliacion}
                onChange={handleChange('fechaAfiliacion')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              placeholder="Notas adicionales sobre el asociado…"
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
            {esEdicion ? 'Guardar cambios' : 'Guardar asociado'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
