import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useReactions } from '../../hooks/useReactions';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { EmojiBurst } from './ReactionBar';
import ZoomableImage from './ZoomableImage';
import logo from '../../assets/logo-losguaduales.webp';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function GalleryModal({ item, items = [], index = 0, onNavigate, onClose }) {
  const [expandedImg, setExpandedImg] = useState(false);
  const { reacciones, misReacciones, toggle } = useReactions(item?.id);
  const { toast } = useToast();

  // Evita que el fondo se pueda mover mientras el modal está abierto (y de
  // paso corrige que en algunos móviles el modal apareciera desplazado hacia
  // arriba en vez de centrado en la pantalla).
  useLockBodyScroll(Boolean(item));

  // Restablece el modo expandido cada vez que se cambia de imagen
  useEffect(() => setExpandedImg(false), [item?.id]);

  // Navegación con teclado
  useEffect(() => {
    if (!item) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && items.length > 1) goTo(index + 1);
      if (e.key === 'ArrowLeft' && items.length > 1) goTo(index - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, index, items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const goTo = (newIndex) => {
    if (!items.length) return;
    const safeIndex = (newIndex + items.length) % items.length;
    onNavigate?.(items[safeIndex], safeIndex);
  };

  const handleToggle = async (emoji) => {
    const ok = await toggle(emoji);
    if (!ok) toast('No se pudo registrar tu reacción.', 'error');
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-start sm:items-center justify-center p-2 sm:p-6 py-6 sm:py-6 overflow-y-auto overscroll-contain animate-modalOverlayIn"
      onClick={onClose}
    >
      <div
        className="bg-[#171c26] w-full max-w-3xl rounded-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[calc(100dvh-3rem)] sm:max-h-[92dvh] animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-4 text-white/80 hover:text-white z-20 text-2xl leading-none"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header: autor/fecha */}
        <div className="flex items-center gap-3 px-5 py-3 bg-black/20 shrink-0">
          <img src={logo} alt="Acueducto Los Guaduales" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{item.autor || 'Acueducto Los Guaduales'}</span>
            <span className="text-xs text-gray-400">{formatFecha(item.fechaCreacion)}</span>
          </div>
        </div>

        {/* Imagen con zoom libre (rueda, pellizco, botones) y expandir */}
        <div
          className={
            expandedImg
              ? 'fixed inset-0 z-[70] bg-black'
              : 'relative z-0 bg-black h-72 sm:h-96 overflow-hidden shrink-0'
          }
        >
          <ZoomableImage
            key={item.id}
            src={item.imagenUrl}
            alt={item.titulo}
            expanded={expandedImg}
            onToggleExpand={() => setExpandedImg((v) => !v)}
          />

          {items.length > 1 && (
            <>
              <button
                onClick={() => goTo(index - 1)}
                aria-label="Anterior"
                className="nav-btn absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => goTo(index + 1)}
                aria-label="Siguiente"
                className="nav-btn absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer: título, descripción y reacciones */}
        <div className="px-5 py-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-1">{item.titulo}</h3>
          <p className="text-sm text-gray-300">{item.descripcionCorta}</p>

          <ReactionBarDark reacciones={reacciones} misReacciones={misReacciones} onToggle={handleToggle} />
        </div>
      </div>
    </div>
  );
}

const EMOJIS_SUGERIDOS_DARK = ['👍', '❤️', '😮', '😂', '😢', '🔥', '🙏', '🚀'];

// Variante de ReactionBar con estética oscura fija, ya que este modal siempre usa fondo oscuro
// como en el diseño original de gallery.html, sin importar el modo claro/oscuro del sitio.
// Incluye las mismas opciones que la barra de reacciones de Publicaciones: emoji personalizado
// y la animación de "explosión" al reaccionar por primera vez.
function ReactionBarDark({ reacciones, misReacciones, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [animEmoji, setAnimEmoji] = useState(null);
  const [customEmoji, setCustomEmoji] = useState('');
  const [burst, setBurst] = useState(null); // { emoji, anchor: 'chip' | 'add', key }
  const pickerRef = useRef(null);
  const customInputRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  const handleReact = (emoji, anchor = 'add') => {
    const trimmed = emoji.trim();
    if (!trimmed) return;
    const esNueva = !misReacciones.includes(trimmed);
    onToggle(trimmed);
    setAnimEmoji(trimmed);
    setTimeout(() => setAnimEmoji(null), 400);

    if (esNueva) {
      const key = Date.now();
      setBurst({ emoji: trimmed, anchor, key });
      setTimeout(() => {
        setBurst((prev) => (prev && prev.key === key ? null : prev));
      }, 900);
    }

    setPickerOpen(false);
    setCustomEmoji('');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmoji.trim()) return;
    const primer = [...customEmoji.trim()][0];
    if (primer) handleReact(primer, 'add');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
      {reacciones
        .filter((r) => r.contador > 0)
        .map((r) => {
          const activo = misReacciones.includes(r.emoji);
          return (
            <button
              key={r.emoji}
              type="button"
              onClick={() => handleReact(r.emoji, 'chip')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activo ? 'bg-blue-500/20 border-brand-light text-white' : 'bg-transparent border-white/20 text-gray-200 hover:bg-white/5'
              }`}
            >
              <span className={animEmoji === r.emoji ? 'emoji-anim inline-block' : 'inline-block'}>{r.emoji}</span>
              <span>{r.contador}</span>
              {burst?.anchor === 'chip' && burst.emoji === r.emoji && <EmojiBurst emoji={r.emoji} />}
            </button>
          );
        })}

      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Agregar reacción"
          className="relative w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-gray-300 hover:bg-white/10 transition-colors text-lg"
        >
          +
          {burst?.anchor === 'add' && <EmojiBurst emoji={burst.emoji} />}
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-[#212936] shadow-xl rounded-2xl p-3 z-[9999] border border-white/10" style={{ width: 232 }}>
            {/* Emojis rápidos */}
            <div className="flex flex-wrap gap-1 mb-3">
              {EMOJIS_SUGERIDOS_DARK.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input de emoji personalizado */}
            <div className="border-t border-white/10 pt-2">
              <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Emoji personalizado</p>
              <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder="Escribe un emoji…"
                  className="flex-1 px-2.5 py-1.5 text-sm bg-[#171c26] border border-white/10 rounded-lg outline-none focus:border-brand text-white min-w-0"
                  maxLength={8}
                />
                <button
                  type="submit"
                  disabled={!customEmoji.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 text-white transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
