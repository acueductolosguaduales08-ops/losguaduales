import { useEffect, useState } from 'react';
import { Loader2, Save, Building2, Banknote, ReceiptText } from 'lucide-react';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';
import { setStoredHeroImageUrl } from '../../utils/heroConfig';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

const sectionCls =
  'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5 space-y-4';

const initialForm = {
  nombreAcueducto: '',
  nit: '',
  direccion: '',
  telefonoPrincipal: '',
  correo: '',
  municipio: '',
  departamento: '',
  banco: '',
  tipoCuenta: '',
  numeroCuenta: '',
  titularCuenta: '',
  valorM3: '',
  cargoFijoAdministracion: '',
  valorReconexion: '',
  valorMultaDefecto: '',
  diasPlazoPago: '',
  notasFactura: '',
  heroImagenUrl: '',
};

// Panel de configuración general — GET/PUT /api/v1/configuracion.
export default function ConfiguracionGeneralForm() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cargar = () => {
    setLoading(true);
    ConfiguracionAPI.obtener()
      .then((data) =>
        setForm({
          nombreAcueducto: data.nombreAcueducto || '',
          nit: data.nit || '',
          direccion: data.direccion || '',
          telefonoPrincipal: data.telefonoPrincipal || '',
          correo: data.correo || '',
          municipio: data.municipio || '',
          departamento: data.departamento || '',
          banco: data.banco || '',
          tipoCuenta: data.tipoCuenta || '',
          numeroCuenta: data.numeroCuenta || '',
          titularCuenta: data.titularCuenta || '',
          valorM3: data.valorM3 != null ? String(data.valorM3) : '',
          cargoFijoAdministracion: data.cargoFijoAdministracion != null ? String(data.cargoFijoAdministracion) : '',
          valorReconexion: data.valorReconexion != null ? String(data.valorReconexion) : '',
          valorMultaDefecto: data.valorMultaDefecto != null ? String(data.valorMultaDefecto) : '',
          diasPlazoPago: data.diasPlazoPago != null ? String(data.diasPlazoPago) : '',
          notasFactura: data.notasFactura || '',
          heroImagenUrl: data.heroImagenUrl || '',
        })
      )
      .catch((err) => toast(err.message || 'No se pudo cargar la configuración.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombreAcueducto.trim()) {
      toast('El nombre del acueducto es obligatorio.', 'warning');
      return;
    }
    if (!form.valorM3 || Number(form.valorM3) <= 0) {
      toast('El valor por m³ es obligatorio y debe ser mayor a 0.', 'warning');
      return;
    }
    if (!form.cargoFijoAdministracion || Number(form.cargoFijoAdministracion) <= 0) {
      toast('El cargo fijo de administración es obligatorio y debe ser mayor a 0.', 'warning');
      return;
    }

    const payload = {
      nombreAcueducto: form.nombreAcueducto.trim(),
      nit: form.nit || null,
      direccion: form.direccion || null,
      telefonoPrincipal: form.telefonoPrincipal || null,
      correo: form.correo || null,
      municipio: form.municipio || null,
      departamento: form.departamento || null,
      banco: form.banco || null,
      tipoCuenta: form.tipoCuenta || null,
      numeroCuenta: form.numeroCuenta || null,
      titularCuenta: form.titularCuenta || null,
      valorM3: Number(form.valorM3),
      cargoFijoAdministracion: Number(form.cargoFijoAdministracion),
      valorReconexion: form.valorReconexion ? Number(form.valorReconexion) : null,
      valorMultaDefecto: form.valorMultaDefecto ? Number(form.valorMultaDefecto) : null,
      diasPlazoPago: form.diasPlazoPago ? Number(form.diasPlazoPago) : null,
      notasFactura: form.notasFactura || null,
      heroImagenUrl: form.heroImagenUrl?.trim() || null,
    };

    setSubmitting(true);
    try {
      await ConfiguracionAPI.actualizar(payload);
      setStoredHeroImageUrl(form.heroImagenUrl?.trim() || '');
      toast('Configuración actualizada correctamente.', 'success');
    } catch (err) {
      toast(err.message || 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando configuración…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand" /> Datos institucionales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Nombre del acueducto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nombreAcueducto}
              onChange={handleChange('nombreAcueducto')}
              placeholder="Ingrese el nombre del acueducto"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>NIT</label>
            <input type="text" value={form.nit} onChange={handleChange('nit')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Teléfono principal</label>
            <input
              type="text"
              value={form.telefonoPrincipal}
              onChange={handleChange('telefonoPrincipal')}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Dirección</label>
            <input type="text" value={form.direccion} onChange={handleChange('direccion')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Municipio</label>
            <input type="text" value={form.municipio} onChange={handleChange('municipio')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Departamento</label>
            <input
              type="text"
              value={form.departamento}
              onChange={handleChange('departamento')}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Correo</label>
            <input type="email" value={form.correo} onChange={handleChange('correo')} className={inputCls} />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-500" /> Cuenta bancaria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Banco</label>
            <input type="text" value={form.banco} onChange={handleChange('banco')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo de cuenta</label>
            <input
              type="text"
              value={form.tipoCuenta}
              onChange={handleChange('tipoCuenta')}
              placeholder="Ahorros / Corriente"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Número de cuenta</label>
            <input
              type="text"
              value={form.numeroCuenta}
              onChange={handleChange('numeroCuenta')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Titular de la cuenta</label>
            <input
              type="text"
              value={form.titularCuenta}
              onChange={handleChange('titularCuenta')}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-amber-500" /> Tarifas y facturación
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
          Los cambios de tarifa solo afectan a las facturas nuevas; las ya emitidas no se recalculan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Valor por m³ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.valorM3}
              onChange={handleChange('valorM3')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Cargo fijo de administración <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.cargoFijoAdministracion}
              onChange={handleChange('cargoFijoAdministracion')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Valor de reconexión</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valorReconexion}
              onChange={handleChange('valorReconexion')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Valor de multa por defecto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valorMultaDefecto}
              onChange={handleChange('valorMultaDefecto')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Días de plazo para pago</label>
            <input
              type="number"
              min="0"
              value={form.diasPlazoPago}
              onChange={handleChange('diasPlazoPago')}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notas al pie de la factura</label>
          <textarea
            value={form.notasFactura}
            onChange={handleChange('notasFactura')}
            rows={3}
            placeholder="Escriba las notas que aparecerán en la factura"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand" /> Hero de la pantalla de inicio
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Imagen del Hero por URL</label>
            <input
              type="url"
              value={form.heroImagenUrl}
              onChange={handleChange('heroImagenUrl')}
              placeholder="https://sitio.com/imagen-hero.jpg"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Si se especifica una URL válida, se usará como imagen de fondo del hero en la página de inicio.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand/20"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar configuración
        </button>
      </div>
    </form>
  );
}
