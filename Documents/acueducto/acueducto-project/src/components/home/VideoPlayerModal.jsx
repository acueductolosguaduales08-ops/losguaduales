import { X } from 'lucide-react';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

export default function VideoPlayerModal({ video, onClose }) {
  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.urlVideo);

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold truncate pr-4">{video.titulo}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/80 hover:text-white shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.titulo}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <a
                href={video.urlVideo}
                target="_blank"
                rel="noreferrer"
                className="text-brand-light underline text-sm"
              >
                Abrir video en una nueva pestaña
              </a>
            </div>
          )}
        </div>

        {video.descripcion && <p className="text-sm text-gray-300 mt-3">{video.descripcion}</p>}
      </div>
    </div>
  );
}
