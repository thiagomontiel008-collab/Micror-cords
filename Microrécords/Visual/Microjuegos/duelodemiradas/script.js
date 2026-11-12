function iniciarTemporizadorMicrojuego(duracion, alActivar) {
  let temporizador = document.getElementById('temporizador-mecha');
  if (!temporizador) {
    const enlaceEstilos = document.createElement('link');
    enlaceEstilos.rel = 'stylesheet';
    enlaceEstilos.href = '../Global/temporizador.css?v=5';
    document.head.appendChild(enlaceEstilos);

    temporizador = document.createElement('div');
    temporizador.id = 'temporizador-mecha';
    temporizador.className = 'temporizador-mecha';
    temporizador.setAttribute('role', 'img');
    const mecha = document.createElement('div');
    mecha.className = 'mecha';
    for (let fase = 1; fase <= 3; fase++) {
      const tramo = document.createElement('span');
      tramo.className = `tramo-mecha tramo-${fase}`;
      mecha.appendChild(tramo);
    }
    const reloj = document.createElement('div');
    reloj.className = 'reloj';
    const manecillaMinuto = document.createElement('span');
    manecillaMinuto.className = 'manecilla manecilla-minuto';
    const manecillaSegundo = document.createElement('span');
    manecillaSegundo.className = 'manecilla manecilla-segundo';
    reloj.append(manecillaMinuto, manecillaSegundo);
    temporizador.append(mecha, reloj);
    document.body.appendChild(temporizador);
  }
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

const idMicrojuego = 'duelodemiradas';
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

class DueloDeMiradas {
  constructor() {
    // Elementos del DOM
    this.rostro = document.getElementById('rostro');
    this.info = document.getElementById('info');
    this.Videoperder = document.getElementById('Perder');
    this.Videoganar = document.getElementById("Ganar");

    // CONFIGURACIÓN
    this.TIEMPO_GLOBAL = 3000;    // Duración del duelo
    this.TIEMPO_MAX_FUERA = 1000; // Máximo tiempo fuera consecutivo
    this.INTERVALO = 50;          // Intervalo de chequeo

    // ESTADO
    this.tiempoFueraConsecutivo = 0;
    this.superoTiempoFuera = false;
    this.estoyDentro = false;
    this.intervaloID = null;
  }

  init() {
    this.rostro.addEventListener('mouseover', () => this.estoyDentro = true);
    this.rostro.addEventListener('mouseout', () => this.estoyDentro = false);

    // Intervalo que mide tiempo fuera consecutivo
    this.intervaloID = setInterval(() => {
      if (!this.estoyDentro) {
        this.tiempoFueraConsecutivo += this.INTERVALO;
        if (this.tiempoFueraConsecutivo > this.TIEMPO_MAX_FUERA) {
          this.superoTiempoFuera = true; // Marca que se excedió el tiempo
        }
      } else {
        this.tiempoFueraConsecutivo = 0; // Resetea al volver al rostro
      }
    }, this.INTERVALO);

    // Temporizador global: al finalizar decide resultado
    this.cancelarTemporizador = iniciarTemporizadorMicrojuego(
      this.TIEMPO_GLOBAL,
      () => this.finalizarDuelo()
    );
  }

  finalizarDuelo() {
    clearInterval(this.intervaloID);

    if (this.superoTiempoFuera) {
      this.perder();
    } else {
      this.ganar();
    }
  }

  ganar() {
    this.Videoganar.style.display = "block";
    const carpetas = [
      "../atraparmariposa/index.html",
      "../torre%20de%20sombreros/index.html",
      "../comerlapizza/index.html",
      "../esquivalosproyectiles/index.html"
    ]
    const Elegir = Math.floor(Math.random() * carpetas.length);
    registrarResultadoMicrojuego(true).finally(() => {
      setTimeout(() => {
        window.location.href = carpetas[Elegir];
      }, 3000);
    });
  }

  perder() {
     this.Videoperder.style.display = 'block';
        this.Videoperder.play().catch((error) => console.error('No se pudo reproducir el video de derrota:', error));
        registrarResultadoMicrojuego(false).finally(() => {
          setTimeout(() => {
            window.location.href = "../../../Perder/index.html";
          }, 3000);
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

  video.style.display = 'none';
  document.getElementById('Texto').style.display = 'none';
    const juego = new DueloDeMiradas();
    juego.init();
});