const catalogoLogros = {
  primeros_pasos: ['Primeros pasos', 'Juega tres microjuegos en total.'],
  segundos_pasos: ['Segundos pasos', 'Juega 20 microjuegos en total.'],
  demasiados_pasos: ['Demasiados pasos', 'Juega 100 microjuegos en total.'],
  todos_son_mios: ['¡Todos son míos!', 'Juega todos los microjuegos una vez.'],
  supremitis_aguda: ['Supremitis aguda', 'Llega al puesto 1 al menos una vez.']
};

const contenedorLogros = document.getElementById('notificaciones-logros');
const claveLogrosPendientes = 'microrécords_logros_pendientes';

function mostrarLogro(idLogro) {
  const logro = catalogoLogros[idLogro];
  if (!logro) {
    return;
  }

  const tarjeta = document.createElement('div');
  tarjeta.className = 'notificacion-logro';
  const titulo = document.createElement('strong');
  titulo.textContent = logro[0];
  const descripcion = document.createElement('span');
  descripcion.textContent = logro[1];
  tarjeta.append(titulo, descripcion);
  contenedorLogros.appendChild(tarjeta);

  window.setTimeout(() => {
    tarjeta.classList.add('saliendo');
    tarjeta.addEventListener('animationend', () => tarjeta.remove(), { once: true });
  }, 2800);
}

try {
  const pendientes = JSON.parse(localStorage.getItem(claveLogrosPendientes) || '[]');
  if (!Array.isArray(pendientes)) {
    throw new Error('La cola de notificaciones de logros no es válida.');
  }
  localStorage.removeItem(claveLogrosPendientes);
  pendientes.filter((idLogro) => typeof idLogro === 'string').forEach((idLogro, indice) => {
    window.setTimeout(() => mostrarLogro(idLogro), indice * 3300);
  });
} catch (error) {
  console.error('No se pudieron cargar las notificaciones de logros:', error);
}
