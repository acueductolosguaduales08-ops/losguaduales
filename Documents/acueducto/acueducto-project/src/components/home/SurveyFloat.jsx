import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ClipboardList } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { EncuestasAPI } from '../../api/encuestas';

export default function SurveyFloat() {
  const [dismissed, setDismissed] = useState(false);
  const [closed, setClosed] = useState(false);
  const navigate = useNavigate();

  const { data } = useFetch(() => EncuestasAPI.listarPublicas(), []);
  const hayEncuestas = (data || []).length > 0;

  if (!hayEncuestas || closed) return null;

  const handleClose = () => {
    setDismissed(true);
    setTimeout(() => setClosed(true), 300);
  };

  return (
    <div
      className={`relative w-full max-w-[350px] ${dismissed ? 'animate-surveyOut' : 'animate-surveyIn'}`}
    >
      <button
        onClick={() => navigate('/encuestas')}
        className="survey-card w-full text-left rounded-xl rounded-tl-none rounded-bl-none p-3 flex items-start gap-3 shadow-md"
      >
        <ClipboardList className="w-8 h-8 text-brand shrink-0 mt-0.5" />
        <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug pr-4">
          <strong className="block text-brand-dark dark:text-blue-200 text-sm mb-0.5">
            Las encuestas están disponibles
          </strong>
          Responde la tuya. Si necesitas ayuda, comunícate con nosotros.
        </p>
      </button>
      <button
        onClick={handleClose}
        aria-label="Cerrar aviso"
        className="absolute top-2 right-2 text-gray-500 dark:text-gray-400"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
