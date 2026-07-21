import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useReactions } from '../../hooks/useReactions';
import { useToast } from '../../context/ToastContext';
import { useEtiquetasColor } from '../../hooks/useEtiquetasColor';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import ReactionBar from './ReactionBar';
import ZoomableImage from './ZoomableImage';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function PostModal({ post, onClose }) {
  const [expandedImg, setExpandedImg] = useState(false);
  const { reacciones, misReacciones, toggle } = useReactions(post?.id);
  const { toast } = useToast();
  const { colorDe } = useEtiquetasColor();

  // Evita que el fondo se pueda mover mientras el modal está abierto (y de
  // paso corrige que en algunos móviles el modal apareciera desplazado hacia
  // arriba en vez de centrado en la pantalla).
  useLockBodyScroll(Boolean(post));

  // Restablece el modo expandido cada vez que se abre otra publicación
  useEffect(() => setExpandedImg(false), [post?.id]);

  if (!post) return null;

  const handleToggle = async (emoji) => {
    const ok = await toggle(emoji);
    if (!ok) toast('No se pudo registrar tu reacción.', 'error');
  };

  const renderImagen = (wrapperClass) => (
    <div className={expandedImg ? 'fixed inset-0 z-[70] bg-black' : wrapperClass}>
      <ZoomableImage
        key={post.id}
        src={post.imagenUrl}
        alt={post.titulo}
        expanded={expandedImg}
        onToggleExpand={() => setExpandedImg((v) => !v)}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-8 pt-8 pb-8 touch-pan-y"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {post.imagenUrl &&
          post.posicionImagen === 'ARRIBA' &&
          renderImagen('relative bg-black overflow-hidden h-72')}

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">{post.autor}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(post.fechaCreacion)}</span>
            </div>
            {post.categoria && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 capitalize">
                {post.categoria}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{post.titulo}</h2>

          {post.imagenUrl &&
            post.posicionImagen === 'MEDIO' &&
            renderImagen('relative bg-black overflow-hidden h-64 rounded-xl mb-4')}

          {/* Contenido HTML enriquecido: tablas, listas, alineaciones, enlaces, etc. */}
          <div
            className="prose-content text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.contenidoCompleto || post.descripcionCorta || '' }}
          />

          {post.imagenUrl &&
            post.posicionImagen === 'ABAJO' &&
            renderImagen('relative bg-black overflow-hidden h-64 rounded-xl mt-4')}

          {(post.etiquetas || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {post.etiquetas.map((tag) => (
                <span
                  key={tag}
                  style={{ borderColor: colorDe(tag), color: colorDe(tag) }}
                  className="text-xs bg-transparent border px-2.5 py-1 rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <ReactionBar reacciones={reacciones} misReacciones={misReacciones} onToggle={handleToggle} />
        </div>
      </div>
    </div>
  );
}
