function iniciarTemporizadorMicrojuego(duracion, alActivar) {
  const temporizador = document.getElementById('temporizador-mecha');
  temporizador.hidden = false;
  temporizador.classList.remove('fase-0', 'fase-1', 'fase-2', 'fase-3', 'activado');
  temporizador.setAttribute('aria-label', 'Tiempo restante');
  const inicio = performance.now();
  let marco = 0;
  let cancelado = false;
  const actualizar = (ahora) => {
    if (cancelado) return;
    const progreso = Math.min((ahora - inicio) / duracion, 1);
    const fase = Math.min(Math.floor(progreso * 3) + 1, 3);
    temporizador.classList.remove('fase-1', 'fase-2', 'fase-3');
    temporizador.classList.add(`fase-${fase}`);
    if (progreso >= 1) {
      temporizador.classList.add('activado');
      temporizador.setAttribute('aria-label', 'Tiempo agotado');
      window.setTimeout(() => {
        if (!cancelado) alActivar();
        temporizador.hidden = true;
      }, 500);
      return;
    }
    marco = window.requestAnimationFrame(actualizar);
  };
  marco = window.requestAnimationFrame(actualizar);
  return () => {
    cancelado = true;
    window.cancelAnimationFrame(marco);
    temporizador.hidden = true;
  };
}

const idMicrojuego = 'esquivalosproyectiles';
const intentoMicrojuego = fetch(`../../../index.php?accion=iniciar_microjuego&microjuego=${idMicrojuego}`, {
  credentials: 'same-origin'
}).then(async (respuesta) => {
  const datos = await respuesta.json();
  if (!respuesta.ok || datos.status !== 'success' || !datos.intento) {
    throw new Error(datos.mensaje || 'No se pudo iniciar el registro de la partida.');
  }
  return datos.intento;
});

function registrarResultadoMicrojuego(victoria) {
  return intentoMicrojuego.then((intento) => fetch('../../../index.php?accion=finalizar_microjuego', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ microjuego: idMicrojuego, intento, victoria })
  })).then(async (respuesta) => {
    const datos = await respuesta.json();
    if (!respuesta.ok || datos.status !== 'success') {
      throw new Error(datos.mensaje || 'No se pudo guardar el resultado de la partida.');
    }
    const nuevos = Array.isArray(datos.logros_nuevos) ? datos.logros_nuevos : [];
    if (nuevos.length > 0) {
      const clave = 'microrécords_logros_pendientes';
      const pendientes = JSON.parse(localStorage.getItem(clave) || '[]');
      if (!Array.isArray(pendientes)) {
        throw new Error('La cola de notificaciones de logros no es válida.');
      }
      localStorage.setItem(clave, JSON.stringify([...new Set([...pendientes, ...nuevos])]));
    }
  }).catch((error) => {
    console.error('Error al registrar la partida:', error);
  });
}

class EsquivaProyectiles {
  constructor() {
    this.precauciones = [...document.querySelectorAll('.precaucion')];
    this.contenedorProyectiles = document.getElementById('proyectiles');
    this.estado = document.getElementById('estado');
    this.videoPerder = document.getElementById('Perder');
    this.videoGanar = document.getElementById('Ganar');
    this.posicionPuntero = null;
    this.zonasPeligrosas = [];
    this.resultadoLanzamiento = false;
    this.finalizado = false;
    document.addEventListener('pointermove', (evento) => {
      this.posicionPuntero = { x: evento.clientX, y: evento.clientY };
    });
    this.cancelarTemporizador = iniciarTemporizadorMicrojuego(5000, () => {
      this.finalizar(this.resultadoLanzamiento);
    });
    window.setTimeout(() => this.mostrarPrecauciones(), 2000);
    window.setTimeout(() => this.lanzarProyectiles(), 4000);
  }

  mostrarPrecauciones() {
    if (this.finalizado) return;
    const carriles = ['arriba', 'centro', 'abajo'];
    this.precauciones.forEach((precaucion, indice) => {
      const carril = carriles[Math.floor(Math.random() * carriles.length)];
      const lado = Math.random() < 0.5 ? 'izquierda' : 'derecha';
      precaucion.classList.add('visible', carril, lado);
      precaucion.setAttribute('aria-label', `Precaución: proyectil por ${lado}, zona ${carril}`);
      this.zonasPeligrosas.push(carril);
    });
    this.estado.textContent = '¡Atención! Busca una zona segura.';
  }

  lanzarProyectiles() {
    if (this.finalizado) return;
    this.precauciones.forEach((precaucion) => {
      const carril = ['arriba', 'centro', 'abajo'].find((nombre) => precaucion.classList.contains(nombre));
      const lado = precaucion.classList.contains('izquierda') ? 'izquierda' : 'derecha';
      const proyectil = document.createElement('span');
      proyectil.className = `proyectil ${carril} ${lado}`;
      this.contenedorProyectiles.appendChild(proyectil);
    });
    const carrilPuntero = this.posicionPuntero
      ? Math.min(Math.floor((this.posicionPuntero.y / window.innerHeight) * 3), 2)
      : -1;
    const nombresCarriles = ['arriba', 'centro', 'abajo'];
    const enZonaPeligrosa = !this.posicionPuntero ||
      this.zonasPeligrosas.includes(nombresCarriles[carrilPuntero]);
    this.resultadoLanzamiento = !enZonaPeligrosa;
    this.estado.textContent = this.resultadoLanzamiento ? '¡Esquivaste los proyectiles!' : '¡Te alcanzó un proyectil!';
  }

  finalizar(victoria) {
    if (this.finalizado) return;
    this.finalizado = true;
    this.cancelarTemporizador();
    if (victoria) {
      this.videoGanar.style.display = 'block';
      const juegosSiguientes = [
        '../atraparmariposa/index.html',
        '../duelodemiradas/index.html',
        '../torre%20de%20sombreros/index.html',
        '../comerlapizza/index.html'
      ];
      const siguiente = juegosSiguientes[Math.floor(Math.random() * juegosSiguientes.length)];
      registrarResultadoMicrojuego(true).finally(() => {
        window.setTimeout(() => { window.location.href = siguiente; }, 3000);
      });
      return;
    }
    this.videoPerder.style.display = 'block';
    this.videoPerder.play().catch((error) => console.error('No se pudo reproducir el video de derrota:', error));
    registrarResultadoMicrojuego(false).finally(() => {
      window.setTimeout(() => { window.location.href = '../../../Perder/index.html'; }, 3000);
    });
  }
}

const video = document.getElementById('mostrarmicrojuego');
let reproducciones = 0;
video.addEventListener('ended', () => {
  reproducciones++;
  if (reproducciones < 2) {
    video.currentTime = 0;
    video.play().catch((error) => console.error('No se pudo repetir el video de introducción:', error));
    return;
  }
  document.querySelector('.Contienevideo').style.display = 'none';
  new EsquivaProyectiles();
});
