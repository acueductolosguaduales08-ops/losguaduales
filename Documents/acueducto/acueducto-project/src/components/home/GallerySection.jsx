import { useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { HomeAPI } from '../../api/home';
import { GALLERY_CATEGORY } from '../../api/publicaciones';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Tamaño fijo para cada imagen en el scroll horizontal
const IMG_W = 160; // px
const IMG_H = 160; // px
const GAP = 12;    // px

export default function GallerySection({ onOpenItem }) {
  const [filtro, setFiltro] = useState('todos');

  const { data, loading, error } = useFetch(() => HomeAPI.publicacionesPublicas({ page: 0, size: 48 }), []);

  const itemsGaleria = useMemo(() => {
    const content = data?.content || [];
    return content.filter((p) => (p.categoria || '').toLowerCase() === GALLERY_CATEGORY);
  }, [data]);

  const etiquetasDisponibles = useMemo(() => {
    const set = new Set();
    itemsGaleria.forEach((p) => (p.etiquetas || []).forEach((e) => set.add(e)));
    return Array.from(set);
  }, [itemsGaleria]);

  const itemsFiltrados = useMemo(() => {
    if (filtro === 'todos') return itemsGaleria;
    return itemsGaleria.filter((p) => (p.etiquetas || []).some((e) => e.toLowerCase() === filtro.toLowerCase()));
  }, [itemsGaleria, filtro]);

  // Dividir en 2 filas alternando: fila1 = índices pares, fila2 = índices impares
  const fila1 = useMemo(() => itemsFiltrados.filter((_, i) => i % 2 === 0), [itemsFiltrados]);
  const fila2 = useMemo(() => itemsFiltrados.filter((_, i) => i % 2 === 1), [itemsFiltrados]);

  return (
    <section id="galeria" className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-5 h-5 text-brand" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Galería</h2>
      </div>

      {etiquetasDisponibles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filtro === 'todos' ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-dark-muted text-gray-700 dark:text-gray-200'
            }`}
          >
            Todos
          </button>
          {etiquetasDisponibles.map((tag) => (
            <button
              key={tag}
              onClick={() => setFiltro(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                filtro === tag ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-dark-muted text-gray-700 dark:text-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse shrink-0"
                style={{ width: IMG_W, height: IMG_H }} />
            ))}
          </div>
          <div className="flex gap-3">
            {[5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse shrink-0"
                style={{ width: IMG_W, height: IMG_H }} />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-gray-400">No se pudo cargar la galería.</p>}

      {!loading && !error && itemsFiltrados.length === 0 && (
        <p className="text-sm text-gray-400 py-6">Aún no hay imágenes publicadas en la galería.</p>
      )}

      {!loading && itemsFiltrados.length > 0 && (
        /* Wrapper con overflow-x-auto: ambas filas se desplazan juntas */
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex flex-col gap-3" style={{ width: 'max-content' }}>
            {/* Fila 1 */}
            <div className="flex" style={{ gap: GAP }}>
              {fila1.map((item, index) => (
                <GalleryThumb
                  key={item.id}
                  item={item}
                  onClick={() => onOpenItem(item, itemsFiltrados, index * 2)}
                  width={IMG_W}
                  height={IMG_H}
                />
              ))}
            </div>
            {/* Fila 2 (solo si hay elementos) */}
            {fila2.length > 0 && (
              <div className="flex" style={{ gap: GAP }}>
                {fila2.map((item, index) => (
                  <GalleryThumb
                    key={item.id}
                    item={item}
                    onClick={() => onOpenItem(item, itemsFiltrados, index * 2 + 1)}
                    width={IMG_W}
                    height={IMG_H}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryThumb({ item, onClick, width, height }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-dark-card text-left shrink-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ width, height }}
    >
      <img
        src={item.imagenUrl}
        alt={item.titulo}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <h3 className="font-bold text-xs text-white truncate">{item.titulo}</h3>
      </div>
    </button>
  );
}
