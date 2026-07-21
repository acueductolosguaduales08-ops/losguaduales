import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Droplet, Search, AlertTriangle, Calculator } from 'lucide-react';
import { LecturasAPI } from '../../api/lecturas';
import { MedidoresAPI } from '../../api/medidores';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

const initialForm = {
  medidorId: '',
  fechaLectura: '',
  lecturaActual: '',
  observaciones: '',
};

// Modal de registro / edición de lectura (POST /api/v1/lecturas, PUT /api/v1/lecturas/{id}).
export default function LecturaFormModal({ open, lectura, mesContableId, mesLabel, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [medidores, setMedidores] = useState([]);
  const [loadingMedidores, setLoadingMedidores] = useState(false);
  // Buscador en tiempo real del Choice de medidor (por nombre de asociado o número de medidor)
  const [busquedaMedidor, setBusquedaMedidor] = useState('');
  // Calculadora de consumo: valor por m³, editable por el usuario
  const [valorM3, setValorM3] = useState('');

  const esEdicion = !!lectura;
  const baselineRef = useRef(initialForm);

  useEffect(() => {
    if (!open) return;
    // Prellenar el valor por m³ con la tarifa institucional vigente (el usuario puede editarlo)
    ConfiguracionAPI.obtener()
      .then((data) => {
        if (data?.valorM3 != null) setValorM3(String(data.valorM3));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const base = lectura
      ? {
          medidorId: String(lectura.medidorId || ''),
          fechaLectura: lectura.fechaLectura || '',
          lecturaActual: lectura.lecturaActual != null ? String(lectura.lecturaActual) : '',
          observaciones: '',
        }
      : initialForm;
    setForm(base);
    baselineRef.current = base;
    setBusquedaMedidor('');
  }, [open, lectura]);

  useEffect(() => {
    if (!open) return;
    setLoadingMedidores(true);
    MedidoresAPI.listar()
      .then((data) => setMedidores(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setMedidores([]))
      .finally(() => setLoadingMedidores(false));
  }, [open]);

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open);

  if (!open) return null;

  const medidorSeleccionado = medidores.find((m) => String(m.id) === form.medidorId) || null;
  const lecturaAnteriorRef = esEdicion ? lectura.lecturaAnterior : medidorSeleccionado?.ultimaLectura ?? null;

  // Filtro en tiempo real del Choice de medidor por nombre de asociado o número de medidor
  const medidoresFiltrados = medidores.filter((m) => {
    const texto = busquedaMedidor.trim().toLowerCase();
    if (!texto) return true;
    const numero = String(m.numero || '').toLowerCase();
    const asociado = String(m.asociadoNombre || '').toLowerCase();
    return numero.includes(texto) || asociado.includes(texto);
  });

  // Calculadora de consumo: consumo = lectura actual - lectura anterior; total = consumo × valor por m³
  const consumoCalculado =
    form.lecturaActual !== '' && lecturaAnteriorRef != null
      ? Number(form.lecturaActual) - Number(lecturaAnteriorRef)
      : null;
  const consumoNegativo = consumoCalculado != null && consumoCalculado < 0;
  const totalCalculado =
    consumoCalculado != null && !consumoNegativo && valorM3 !== ''
      ? consumoCalculado * Number(valorM3)
      : null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medidorId) {
      toast('Selecciona el medidor al que pertenece la lectura.', 'warning');
      return;
    }
    if (!form.fechaLectura) {
      toast('La fecha de lectura es obligatoria.', 'warning');
      return;
    }
    if (form.lecturaActual === '' || Number(form.lecturaActual) < 0) {
      toast('La lectura actual es obligatoria y no puede ser negativa.', 'warning');
      return;
    }
    if (consumoNegativo) {
      toast('La lectura actual no puede ser menor que la lectura anterior.', 'error');
      return;
    }

    const payload = {
      medidorId: Number(form.medidorId),
      mesContableId,
      fechaLectura: form.fechaLectura,
      lecturaActual: Number(form.lecturaActual),
      observaciones: form.observaciones || null,
    };

    setSubmitting(true);
    try {
      if (esEdicion) {
        await LecturasAPI.editar(lectura.id, payload);
        toast('Lectura actualizada correctamente.', 'success');
      } else {
        await LecturasAPI.crear(payload);
        toast('Lectura registrada correctamente.', 'success');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo guardar la lectura.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {esEdicion ? 'Editar lectura' : 'Registrar lectura'}
            </h3>
            {mesLabel && <p className="text-xs text-gray-500 dark:text-gray-400">Período: {mesLabel}</p>}
          </div>
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
              Medidor <span className="text-red-500">*</span>
            </label>
            {!esEdicion && (
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={busquedaMedidor}
                  onChange={(e) => setBusquedaMedidor(e.target.value)}
                  placeholder="Buscar por nombre de asociado o número de medidor…"
                  className={`${inputCls} pl-9`}
                />
              </div>
            )}
            <select
              value={form.medidorId}
              onChange={handleChange('medidorId')}
              disabled={esEdicion || loadingMedidores}
              className={`${inputCls} disabled:opacity-60`}
            >
              <option value="">-- Selecciona un medidor --</option>
              {medidoresFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  Nº {m.numero} — {m.asociadoNombre || 'Sin asociado'}
                </option>
              ))}
            </select>
            {loadingMedidores && <p className="text-xs text-gray-400 mt-1">Cargando medidores…</p>}
            {!loadingMedidores && busquedaMedidor.trim() && medidoresFiltrados.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Ningún medidor coincide con la búsqueda.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Fecha de lectura <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.fechaLectura}
                onChange={handleChange('fechaLectura')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <div>
              <label className={labelCls}>
                Lectura actual (m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.lecturaActual}
                onChange={handleChange('lecturaActual')}
                placeholder="Ingrese la lectura actual"
                className={inputCls}
              />
            </div>
          </div>

          <div className="bg-brand/10 border border-brand/30 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand dark:text-brand-light">
              <Calculator className="w-4 h-4" />
              <span>Calculadora de consumo</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Lectura anterior</label>
                <div className="w-full bg-white/70 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200">
                  {lecturaAnteriorRef != null ? `${lecturaAnteriorRef} m³` : 'Sin lectura previa'}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor por m³</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorM3}
                  onChange={(e) => setValorM3(e.target.value)}
                  placeholder="Ingrese el valor por m³"
                  className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-brand/20">
              <div className="flex items-center gap-2 text-sm text-brand dark:text-brand-light">
                <Droplet className="w-4 h-4" />
                <span>Consumo (m³)</span>
              </div>
              <span className={`text-lg font-bold ${consumoNegativo ? 'text-red-500' : 'text-brand'}`}>
                {consumoCalculado != null ? `${consumoCalculado} m³` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-brand dark:text-brand-light">Total</span>
              <span className="text-lg font-bold text-brand">
                {totalCalculado != null
                  ? totalCalculado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
                  : '—'}
              </span>
            </div>

            {consumoNegativo && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                La lectura actual no puede ser menor que la lectura anterior.
              </p>
            )}
          </div>
          {lecturaAnteriorRef == null && form.medidorId && (
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
              Sin lectura anterior registrada: se tomará como primera lectura del medidor.
            </p>
          )}

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              placeholder="Notas sobre la visita o el estado del medidor…"
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
            disabled={submitting || consumoNegativo}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Guardar lectura'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
