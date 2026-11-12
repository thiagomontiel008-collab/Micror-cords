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

const idMicrojuego = 'atraparmariposa';
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

class MariposaCuadrada {
    constructor(contenedor, tamaño) {
        // Propiedades
        this.elemento = document.createElement('div');
        this.elemento.style.width = `${200}px`;
        this.elemento.style.height = `${200}px`;
        this.elemento.id = "Mariposa"
        this.elemento.style.position = 'absolute';
        this.elemento.style.cursor = 'pointer'; // Para indicar que es clickable
        this.elemento.style.transition = 'opacity 0.5s ease-out'; // Para una desaparición suave
        this.elemento.style.transform = 'translate(-50%, -50%)';
        this.info = document.getElementById("info");
        this.ganar = false;
        this.ultimoFrame = performance.now();
        this.inicioTiempo = performance.now();
        // Parámetros de movimiento (ajusta estos valores para cambiar el patrón)
        this.t = 0; // Tiempo o ángulo
        this.velocidad = 0.006; // Velocidad de la simulación
        this.amplitudX = 80; // Amplitud del movimiento lateral
        this.amplitudY = 35;  // Amplitud del movimiento vertical (ondulación)
        this.centerX = 30; // Punto de inicio X (porcentaje)
        this.centerY = 50; // Punto de inicio Y (porcentaje)

        // Adjuntar al contenedor
        contenedor.appendChild(this.elemento);

        // **Añadir el evento de clic**
        this.elemento.addEventListener('click', this.desaparecer.bind(this)); 
        this.tiempo (); 

        this.Videoperder = document.getElementById('Perder');
        this.Videoganar = document.getElementById("Ganar");
    } 

    tiempo(){
        this.cancelarTemporizador = iniciarTemporizadorMicrojuego(5000, () => {
            if (this.ganar != true) {
                this.termina ();
                return;
            }

            this.Videoganar.style.display = "block";
            const carpetas = [
                "../duelodemiradas/index.html",
                "../torre%20de%20sombreros/index.html",
                "../comerlapizza/index.html",
                "../esquivalosproyectiles/index.html"
            ];
            const Elegir = Math.floor(Math.random() * carpetas.length);
            registrarResultadoMicrojuego(true).finally(() => {
                setTimeout(() => {
                    window.location.href = carpetas[Elegir];
                }, 3000);
            });
        });
    }

    // Método para el movimiento (Patrón de Mariposa/Onda)
    mover() {
    const tiempoActual = performance.now();
    const t = (tiempoActual - this.inicioTiempo) * 0.001; 
    // Ajusta 0.003 para la velocidad global

    const x = this.centerX + this.amplitudX * Math.sin(t / 2) * Math.cos(t / 4);
    const y = this.centerY + this.amplitudY * Math.sin(t * 3);

    this.elemento.style.left = `${x}%`;
    this.elemento.style.top = `${y}%`;
    }

    // Método para la desaparición
    desaparecer() {
        this.ganar = true;
        // Oculta el elemento suavemente y luego lo remueve del DOM
        this.elemento.style.opacity = '0';
   // Mostrar la información de victoria     
        setTimeout(() => {
            if (this.elemento.parentNode) {
                this.elemento.parentNode.removeChild(this.elemento);
            }
        }, 500); // 500ms coincide con el 'transition' en el constructor
    }
    
    termina() {
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
    const contenedor = document.body;
    const mariposa = new MariposaCuadrada(contenedor, 100);

    function animar() {
      mariposa.mover();
      requestAnimationFrame(animar);
    }
    animar();
});
