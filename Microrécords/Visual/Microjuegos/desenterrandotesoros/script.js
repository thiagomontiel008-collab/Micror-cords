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

class DesentierraTesoros {
  constructor() {
    this.sitios = [...document.querySelectorAll('.sitio')];
    this.rondas = [...document.querySelectorAll('.ronda')];
    this.palaRota = document.getElementById('pala-rota');
    this.videoPerder = document.getElementById('Perder');
    this.videoGanar = document.getElementById('Ganar');
    this.rondaActual = 0;
    this.resultado = null;
    this.finalizado = false;
    this.revelando = false;
    this.cancelarTemporizador = iniciarTemporizadorMicrojuego(5000, () => this.finalizarPorTiempo());
    this.mostrarRonda();
  }

  mostrarRonda() {
    const tesoro = Math.floor(Math.random() * this.sitios.length);
    this.sitios.forEach((sitio, indice) => {
      sitio.classList.remove('rojizo', 'excavado');
      sitio.querySelectorAll('.hallazgo').forEach((hallazgo) => hallazgo.classList.remove('activo'));
      sitio.classList.toggle('rojizo', indice === tesoro);
      sitio.disabled = false;
      sitio.setAttribute('aria-label', indice === tesoro
        ? 'Excavar cúmulo de tierra rojiza'
        : 'Excavar cúmulo de tierra');
    });
  }

  excavar(sitio) {
    if (this.finalizado || this.revelando || sitio.classList.contains('excavado')) return;
    this.revelando = true;
    sitio.classList.add('excavado');
    sitio.disabled = true;
    const encontroTesoro = sitio.classList.contains('rojizo');
    sitio.querySelector(encontroTesoro ? '.tesoro' : '.piedra').classList.add('activo');

    if (!encontroTesoro) {
      this.resultado = false;
      this.sitios.forEach((elemento) => { elemento.disabled = true; });
      this.palaRota.classList.add('visible');
      return;
    }

    this.rondaActual++;
    this.rondas[this.rondaActual - 1].classList.add('encontrada');
    document.getElementById('rondas').setAttribute(
      'aria-label',
      `Tesoros encontrados: ${this.rondaActual} de 3`
    );
    if (this.rondaActual === this.rondas.length) {
      this.resultado = true;
      this.sitios.forEach((elemento) => { elemento.disabled = true; });
      return;
    }

    window.setTimeout(() => {
      if (this.finalizado) return;
      this.revelando = false;
      this.mostrarRonda();
    }, 500);
  }

  finalizarPorTiempo() {
    if (this.resultado === null) this.resultado = false;
    this.finalizar(this.resultado);
  }

  finalizar(victoria) {
    if (this.finalizado) return;
    this.finalizado = true;
    this.cancelarTemporizador();
    this.sitios.forEach((sitio) => { sitio.disabled = true; });
    if (victoria) {
      this.videoGanar.style.display = 'block';
      window.setTimeout(() => { window.location.replace('../../Menú/menú.html'); }, 3000);
      return;
    }
    this.videoPerder.style.display = 'block';
    this.videoPerder.play().catch((error) => console.error('No se pudo reproducir el video de derrota:', error));
    window.setTimeout(() => { window.location.replace('../../Menú/menú.html'); }, 3000);
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
  const juego = new DesentierraTesoros();
  document.querySelectorAll('.sitio').forEach((sitio) => {
    sitio.addEventListener('click', () => juego.excavar(sitio));
  });
});
