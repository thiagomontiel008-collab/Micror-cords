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

const idMicrojuego = 'torredesombreros';
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

class TorreDeSombreros {
    constructor() {
        this.info = document.getElementById('info');
        this.patoContenedor = null;
        this.sombreroArea = null; 
        this.patoElemento = null;
        this.sombreros = [];
        this.sombrerosColocados = 0; 
        this.gano = false;
        this.tiempoLimite = 8000; // 8 segundos
        this.arrastrando = null;
        this.arrastrarHandler = this.arrastrar.bind(this);
        this.finalizarArrastreHandler = this.finalizarArrastre.bind(this);
        this.offsetX = 0;
        this.offsetY = 0;
        this.tiempo();
         this.Videoperder = document.getElementById('Perder');
        this.Videoganar = document.getElementById("Ganar");
    }

    tiempo() {
        this.cancelarTemporizador = iniciarTemporizadorMicrojuego(this.tiempoLimite, () => {
            if (this.gano) {
                this.Videoganar.style.display = "block";
                const carpetas = [
                    "../atraparmariposa/index.html",
                    "../duelodemiradas/index.html",
                    "../comerlapizza/index.html",
                    "../esquivalosproyectiles/index.html"
                ];
                const Elegir = Math.floor(Math.random() * carpetas.length);
                registrarResultadoMicrojuego(true).finally(() => {
                    setTimeout(() => {
                        window.location.href = carpetas[Elegir];
                    }, 3000);
                });
            } else {
                this.Videoperder.style.display = 'block';
                this.Videoperder.play().catch((error) => console.error('No se pudo reproducir el video de derrota:', error));
                registrarResultadoMicrojuego(false).finally(() => {
                    setTimeout(() => {
                        window.location.href = "../../../Perder/index.html";
                    }, 3000);
                });
            }
        });
    }

    ganar() {
        this.gano = true;
    }

    crearPato() {
        this.patoContenedor = document.createElement('div');
        this.patoContenedor.id = 'pato-contenedor';
        document.body.appendChild(this.patoContenedor);
        
        this.patoElemento = document.createElement('div');
        this.patoElemento.className = 'pato';
        this.patoContenedor.appendChild(this.patoElemento);

        this.sombreroArea = document.createElement('div');
        this.sombreroArea.className = 'sombrero-container';
        document.body.appendChild(this.sombreroArea); 
    }

    crearSombreros() {
        const definiciones = [
            { id: 'hat1', className: 'sombrero-rojo' },
            { id: 'hat2', className: 'sombrero-azul' },
            { id: 'hat3', className: 'sombrero-verde' }
        ];

        definiciones.forEach(def => {
            const sombrero = document.createElement('div');
            sombrero.id = def.id;
            sombrero.className = `sombrero ${def.className}`;
            sombrero.dataset.colocado = 'false';
            this.sombreros.push(sombrero);
            
            this.sombreroArea.appendChild(sombrero);
            
            sombrero.addEventListener('mousedown', this.iniciarArrastre.bind(this));
            sombrero.addEventListener('touchstart', this.iniciarArrastre.bind(this)); 
        });
    }

    iniciarArrastre(e) {
        e.preventDefault();
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        this.arrastrando = e.currentTarget;
        this.arrastrando.style.cursor = 'grabbing';
        
        this.offsetX = clientX - this.arrastrando.getBoundingClientRect().left;
        this.offsetY = clientY - this.arrastrando.getBoundingClientRect().top;

        this.arrastrando.style.position = 'absolute';
        this.arrastrando.style.left = `${clientX - this.offsetX}px`;
        this.arrastrando.style.top = `${clientY - this.offsetY}px`;
        
        document.body.appendChild(this.arrastrando); 

        document.addEventListener('mousemove', this.arrastrarHandler);
        document.addEventListener('mouseup', this.finalizarArrastreHandler);
        document.addEventListener('touchmove', this.arrastrarHandler);
        document.addEventListener('touchend', this.finalizarArrastreHandler);
    }

    arrastrar(e) {
        if (!this.arrastrando) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        this.arrastrando.style.left = `${clientX - this.offsetX}px`;
        this.arrastrando.style.top = `${clientY - this.offsetY}px`;
    }

    finalizarArrastre(e) {
        if (!this.arrastrando) return;

        this.arrastrando.style.cursor = 'grab';

        if (this.checkColision(this.arrastrando)) {
            this.colocarSombrero();
        } 

        this.arrastrando = null;
        
        document.removeEventListener('mousemove', this.arrastrarHandler);
        document.removeEventListener('mouseup', this.finalizarArrastreHandler);
        document.removeEventListener('touchmove', this.arrastrarHandler);
        document.removeEventListener('touchend', this.finalizarArrastreHandler);
    }
    
    checkColision(sombrero) {
        const sombreroRect = sombrero.getBoundingClientRect();
        const patoContRect = this.patoContenedor.getBoundingClientRect();

        const centroX = sombreroRect.left + sombreroRect.width / 2;
        const centroY = sombreroRect.top + sombreroRect.height / 2;
        
        return (
            centroX > patoContRect.left &&
            centroX < patoContRect.right &&
            centroY > patoContRect.top &&
            centroY < patoContRect.bottom
        );
    }

    colocarSombrero() {
        if (this.arrastrando.dataset.colocado === 'true') return;

        this.patoContenedor.appendChild(this.arrastrando);

        this.arrastrando.style.position = 'absolute';
        this.arrastrando.style.left = `50%`; 
        const baseApilamientoY = -50; 
        this.arrastrando.style.top = `${baseApilamientoY - (this.sombrerosColocados * 20)}px`; 
        this.arrastrando.style.transform = 'translateX(-50%)'; 
        this.arrastrando.style.pointerEvents = 'none'; 
        
        this.sombrerosColocados++;
        this.arrastrando.dataset.colocado = 'true';
        
        if (this.sombrerosColocados === this.sombreros.length) {
            this.ganar(); // ✅ marca victoria
        }
    }

    init() {
        this.crearPato();
        this.crearSombreros();
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
    const juego = new TorreDeSombreros();
    juego.init();
});