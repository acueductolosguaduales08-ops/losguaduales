import { useLayoutEffect } from 'react';

// Bloquea el scroll del body/html mientras `active` sea true, para que el
// fondo no se pueda mover detrás de un modal o del menú de navegación.
//
// A propósito NO usa el truco de "position: fixed + top negativo" (muy común
// en otros proyectos) porque en la práctica generaba justo los bugs que
// queríamos evitar: al abrir/cerrar modales en el celular, restaurar el
// scroll con `window.scrollTo` producía un salto visible, y combinado con el
// teclado virtual hacía que la pantalla "persiguiera" al modal en vez de
// quedarse quieta. Un simple overflow:hidden (sin tocar la posición) evita
// el scroll del fondo sin esos saltos, y se complementa con
// `overscroll-contain` en el contenedor interno de cada modal.
export default function useLockBodyScroll(active) {
  useLayoutEffect(() => {
    if (!active) return undefined;

    const html = document.documentElement;
    const { body } = document;
    const previous = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow };

    html.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.height = '100%';
    body.style.touchAction = 'none';

    return () => {
      html.style.overflow = previous.htmlOverflow;
      html.style.height = '';
      body.style.overflow = previous.bodyOverflow;
      body.style.height = '';
      body.style.touchAction = '';
    };
  }, [active]);
}
