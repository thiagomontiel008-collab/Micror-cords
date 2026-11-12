/**
 * ============================================================================
 * LÓGICA PRINCIPAL DE LA INTERFAZ - MICRORÉCORDS (SCRIPT.JS)
 * ============================================================================
 * Este archivo gestiona la lógica del menú principal, la cinemática de inicio,
 * y la navegación entre pantallas (Juego, Autenticación y Cuenta).
 * 
 * Funcionalidades clave:
 * 1. Botón "Cuenta" al lado de "Jugar".
 * 2. Pantalla dentro de la misma página para Iniciar Sesión y Registrarse.
 * 3. Persistencia de sesión mediante localStorage y sesión PHP (recuerda sesión al cerrar/reiniciar).
 * 4. Reconocimiento de usuario y estado de sesión activa.
 * 5. Pantalla de cuenta de usuario con estadísticas y botón en la esquina inferior derecha.
 * 6. Comunicación asíncrona con el backend PHP (fetch a index.php / Rutas/rutas.php).
 */

class Juego {
  constructor() {
    // ------------------------------------------------------------------------
    // ELEMENTOS ORIGINALES DEL JUEGO
    // ------------------------------------------------------------------------
    this.pantallaInicio = document.getElementById('estart');
    this.pantallaIntro = document.getElementById('introducción');
    this.botonJugar = document.getElementById('jugar-boton');
    this.logoSecreto = document.getElementById('logo-secreto');
    this.dArrastrable = document.getElementById('d-arrastrable');
    this.zonaSecreta = document.getElementById('zona-secreta');
    this.mensajeSecreto = document.getElementById('mensaje-secreto');
    this.arrastreSecreto = null;
    this.transicionSecretaIniciada = false;
    this.contenedorNotificaciones = document.getElementById('notificaciones-logros');
    this.botonEmpezar = document.getElementById('empezar-juego-boton');    
    this.botonVolverCinematica = document.getElementById('volver-menu-cinematica-boton');
    this.pantallaLogros = document.getElementById('pantalla-logros');
    this.botonLogros = document.getElementById('logros-boton');
    this.botonVolverLogros = document.getElementById('volver-menu-logros-boton');
    this.claseOculta = 'Y-la-pantalla';
    this.delayBoton = 3000; // Delay de 3000ms (3 segundos) para mostrar el botón Empezar
    this.temporizadorEmpezar = null;

    // ------------------------------------------------------------------------
    // NUEVOS ELEMENTOS: CUENTA, AUTENTICACIÓN Y NAVEGACIÓN
    // ------------------------------------------------------------------------
    // Botón "Cuenta" junto al botón "Jugar"
    this.botonCuenta = document.getElementById('cuenta-boton');
    this.botonTablaPosiciones = document.getElementById('tabla-posiciones-boton');

    // Pantallas dentro de la misma página
    this.pantallaAuth = document.getElementById('pantalla-auth');
    this.pantallaCuenta = document.getElementById('pantalla-cuenta');
    this.pantallaPosiciones = document.getElementById('pantalla-posiciones');

    // Botones de navegación y acción
    this.botonVolverAuth = document.getElementById('volver-menu-auth-boton');
    this.botonVolverCuenta = document.getElementById('boton-esquina-derecha'); // Botón en la esquina inferior derecha
    this.botonCerrarSesion = document.getElementById('cerrar-sesion-boton');
    this.botonEliminarCuenta = document.getElementById('eliminar-cuenta-boton');
    this.botonVolverPosiciones = document.getElementById('volver-menu-posiciones-boton');
    this.tablaPosicionesCuerpo = document.getElementById('tabla-posiciones-cuerpo');
    this.tablaPosicionesMensaje = document.getElementById('tabla-posiciones-mensaje');
    this.tablaPosicionesVista = document.getElementById('tabla-posiciones-vista');
    this.detalleCuentaPosiciones = document.getElementById('detalle-cuenta-posiciones');
    this.detalleCuentaMensaje = document.getElementById('detalle-cuenta-mensaje');
    this.detalleCuentaContenido = document.getElementById('detalle-cuenta-contenido');
    this.detalleCuentaNombre = document.getElementById('detalle-cuenta-nombre');
    this.detalleCuentaPuntuacion = document.getElementById('detalle-cuenta-puntuacion');
    this.detalleCuentaLogros = document.getElementById('detalle-cuenta-logros');
    this.botonVolverTabla = document.getElementById('volver-tabla-posiciones-boton');

    // Pestañas y formularios de Login / Registro
    this.tabLogin = document.getElementById('tab-login');
    this.tabRegistro = document.getElementById('tab-registro');
    this.formLogin = document.getElementById('form-login');
    this.formRegistro = document.getElementById('form-registro');
    this.authMensaje = document.getElementById('auth-mensaje');
    this.authTitulo = document.getElementById('auth-titulo');

    // Campos de datos del usuario en la pantalla de cuenta
    this.cuentaNombre = document.getElementById('cuenta-nombre-usuario');

    // Estado del usuario activo
    this.usuarioActual = null;
    this.claveStorage = 'microrécords_sesion_usuario';
    this.urlApi = '../../index.php';
  }

  /**
   * Inicializa los escuchadores de eventos y verifica la sesión guardada.
   */
  init() {
    // Listener original para el botón "Jugar" 
    this.botonJugar.addEventListener('click', this.mostrarCinematica.bind(this));
    this.iniciarArrastreSecreto();
    
    // Listener original para el botón "Empezar"
    this.botonEmpezar.addEventListener('click', this.irAlJuego.bind(this));

    if (this.botonVolverCinematica) {
      this.botonVolverCinematica.addEventListener('click', this.volverAlMenu.bind(this));
    }

    this.botonLogros.addEventListener('click', this.abrirPantallaLogros.bind(this));
    this.botonVolverLogros.addEventListener('click', this.volverAlMenu.bind(this));

    // Listener para el nuevo botón "Cuenta" al lado de "Jugar"
    if (this.botonCuenta) {
      this.botonCuenta.addEventListener('click', this.abrirPantallaCuenta.bind(this));
    }

    if (this.botonTablaPosiciones) {
      this.botonTablaPosiciones.addEventListener('click', async () => {
        this.pantallaInicio.classList.add(this.claseOculta);
        this.pantallaIntro.classList.add(this.claseOculta);
        this.pantallaAuth.classList.add(this.claseOculta);
        this.pantallaCuenta.classList.add(this.claseOculta);
        this.pantallaLogros.classList.add(this.claseOculta);
        this.pantallaPosiciones.classList.remove(this.claseOculta);
        this.tablaPosicionesVista.classList.remove(this.claseOculta);
        this.detalleCuentaPosiciones.classList.add(this.claseOculta);
        this.tablaPosicionesCuerpo.replaceChildren();
        this.tablaPosicionesMensaje.textContent = 'Cargando posiciones...';

        try {
          const respuesta = await fetch(`${this.urlApi}?accion=tabla_posiciones`, {
            headers: { 'Accept': 'application/json' }
          });
          const datos = await respuesta.json();
          if (!respuesta.ok || datos.status !== 'success' || !Array.isArray(datos.posiciones)) {
            throw new Error(datos.mensaje || 'No se pudo cargar la tabla de posiciones.');
          }

          if (datos.posiciones.length === 0) {
            this.tablaPosicionesMensaje.textContent = 'Todavía no hay jugadores en la tabla.';
            return;
          }

          datos.posiciones.forEach((jugador, indice) => {
            const fila = document.createElement('tr');
            const puesto = document.createElement('td');
            puesto.textContent = String(indice + 1);
            fila.appendChild(puesto);

            const celdaJugador = document.createElement('td');
            
            // Verificamos si la fila actual pertenece al usuario autenticado
            const idPropio = this.usuarioActual?.['id-usuario'] ?? this.usuarioActual?.id_usuario;
            const esUsuarioPropio = idPropio !== undefined && String(idPropio) === String(jugador.id_usuario);

            if (esUsuarioPropio) {
              // Si es el usuario propio, se muestra como texto plano sin botón
              celdaJugador.textContent = jugador.nombre;
            } else {
              // Si es otro usuario, se crea el botón interactivo para ver su cuenta pública
              const botonCuenta = document.createElement('button');
              botonCuenta.type = 'button';
              botonCuenta.className = 'boton-seleccionar-cuenta';
              botonCuenta.dataset.idUsuario = String(jugador.id_usuario);
              botonCuenta.textContent = jugador.nombre;
              botonCuenta.setAttribute('aria-label', `Ver la cuenta de ${jugador.nombre}`);
              celdaJugador.appendChild(botonCuenta);
            }
            fila.appendChild(celdaJugador);

            const puntuacion = document.createElement('td');
            puntuacion.textContent = String(jugador['puntuación']);
            fila.appendChild(puntuacion);
            this.tablaPosicionesCuerpo.appendChild(fila);
          });
          this.tablaPosicionesMensaje.textContent = '';
        } catch (error) {
          console.error('Error al cargar la tabla de posiciones:', error);
          this.tablaPosicionesMensaje.textContent = 'No se pudo cargar la tabla de posiciones.';
        }
      });
    }

    this.tablaPosicionesCuerpo.addEventListener('click', (evento) => {
      const botonCuenta = evento.target.closest('button[data-id-usuario]');
      if (botonCuenta) {
        const idUsuarioDestino = botonCuenta.dataset.idUsuario;
        const idPropio = this.usuarioActual?.['id-usuario'] ?? this.usuarioActual?.id_usuario;
        
        // Capa adicional de seguridad: ignorar el clic si por alguna razón el ID coincide con el propio
        if (idPropio !== undefined && String(idPropio) === String(idUsuarioDestino)) {
          return;
        }

        this.abrirDetalleCuentaPublica(idUsuarioDestino);
      }
    });

    this.botonVolverTabla.addEventListener('click', () => {
      this.detalleCuentaPosiciones.classList.add(this.claseOculta);
      this.tablaPosicionesVista.classList.remove(this.claseOculta);
    });

    // Listener para volver al menú principal desde la pantalla de autenticación
    if (this.botonVolverAuth) {
      this.botonVolverAuth.addEventListener('click', this.volverAlMenu.bind(this));
    }

    // Listener para el botón en la esquina inferior derecha en la pantalla de cuenta
    if (this.botonVolverCuenta) {
      this.botonVolverCuenta.addEventListener('click', this.volverAlMenu.bind(this));
    }

    if (this.botonVolverPosiciones) {
      this.botonVolverPosiciones.addEventListener('click', this.volverAlMenu.bind(this));
    }

    // Listener para el botón de cerrar sesión
    if (this.botonCerrarSesion) {
      this.botonCerrarSesion.addEventListener('click', this.cerrarSesion.bind(this));
    }
    if (this.botonEliminarCuenta) {
      this.botonEliminarCuenta.addEventListener('click', this.eliminarCuenta.bind(this));
    }

    // Listeners para alternar entre pestañas de Iniciar Sesión y Registro
    if (this.tabLogin) {
      this.tabLogin.addEventListener('click', () => this.cambiarTab('login'));
    }
    if (this.tabRegistro) {
      this.tabRegistro.addEventListener('click', () => this.cambiarTab('registro'));
    }

    // Listeners para los envíos de formularios (Login y Registro)
    if (this.formLogin) {
      this.formLogin.addEventListener('submit', this.procesarLogin.bind(this));
    }
    if (this.formRegistro) {
      this.formRegistro.addEventListener('submit', this.procesarRegistro.bind(this));
    }

    // Cargar y recordar la sesión existente al iniciar o recargar la página
    this.cargarSesionRecordada();
  }

  // --------------------------------------------------------------------------
  // MÉTODOS ORIGINALES DE CINEMÁTICA Y NAVEGACIÓN AL JUEGO
  // --------------------------------------------------------------------------

  /**
   * Método original que se ejecuta al hacer clic en "Jugar".
   */
  mostrarCinematica() {
    window.clearTimeout(this.temporizadorEmpezar);
    this.botonEmpezar.classList.add(this.claseOculta);

    this.mostrarPantalla(this.pantallaIntro);

    // Temporizador para mostrar el botón "Empezar"
    this.temporizadorEmpezar = window.setTimeout(() => {
      this.botonEmpezar.classList.remove(this.claseOculta);
    }, this.delayBoton);
  }

  abrirPantallaLogros() {
    this.mostrarPantalla(this.pantallaLogros);
  }

  async abrirDetalleCuentaPublica(idUsuario) {
    this.tablaPosicionesVista.classList.add(this.claseOculta);
    this.detalleCuentaPosiciones.classList.remove(this.claseOculta);
    this.detalleCuentaContenido.classList.add(this.claseOculta);
    this.detalleCuentaMensaje.textContent = 'Cargando cuenta...';

    try {
      const respuesta = await fetch(
        `${this.urlApi}?accion=cuenta_publica&id_usuario=${encodeURIComponent(idUsuario)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const datos = await respuesta.json();
      if (!respuesta.ok || datos.status !== 'success' || !datos.usuario) {
        throw new Error(datos.mensaje || 'No se pudo cargar la cuenta seleccionada.');
      }

      const usuario = datos.usuario;
      this.detalleCuentaNombre.textContent = usuario.nombre;
      this.detalleCuentaPuntuacion.textContent = String(usuario['puntuación']);
      const idPropio = this.usuarioActual?.['id-usuario'] ?? this.usuarioActual?.id_usuario;
      const cuentaPropia = idPropio !== undefined &&
        String(idPropio) === String(usuario['id-usuario']);
      this.renderizarLogrosCuenta(cuentaPropia
        ? usuario.logros
        : {
          ...usuario.logros,
          desbloqueados: (usuario.logros?.desbloqueados || []).filter(
            (id) => id !== 'desenterrando_secretos'
          )
        });
      this.detalleCuentaMensaje.textContent = '';
      this.detalleCuentaContenido.classList.remove(this.claseOculta);
    } catch (error) {
      console.error('Error al cargar la cuenta seleccionada:', error);
      this.detalleCuentaMensaje.textContent = 'No se pudo cargar la cuenta seleccionada.';
    }
  }

  iniciarArrastreSecreto() {
    const limpiarArrastre = () => {
      this.arrastreSecreto = null;
      this.pantallaInicio.classList.remove('secreto-arrastrando');
    };

    this.dArrastrable.addEventListener('pointerdown', (evento) => {
      if (evento.button !== 0 || this.transicionSecretaIniciada) return;
      
      // Si no hay sesión iniciada, se bloquea de forma silenciosa sin texto gigante
      if (!this.usuarioActual) {
        evento.preventDefault();
        return;
      }

      evento.preventDefault();
      const rect = this.dArrastrable.getBoundingClientRect();
      const contenedor = this.logoSecreto.getBoundingClientRect();
      this.arrastreSecreto = {
        pointerId: evento.pointerId,
        offsetX: evento.clientX - rect.left,
        offsetY: evento.clientY - rect.top,
        inicioX: rect.left - contenedor.left,
        inicioY: rect.top - contenedor.top
      };
      this.dArrastrable.style.left = `${this.arrastreSecreto.inicioX}px`;
      this.dArrastrable.style.top = `${this.arrastreSecreto.inicioY}px`;
      this.dArrastrable.setPointerCapture(evento.pointerId);
      this.pantallaInicio.classList.add('secreto-arrastrando');
      this.mensajeSecreto.textContent = '';
    });

    this.dArrastrable.addEventListener('pointermove', (evento) => {
      if (!this.arrastreSecreto || evento.pointerId !== this.arrastreSecreto.pointerId) return;
      const contenedor = this.logoSecreto.getBoundingClientRect();
      this.dArrastrable.style.left = `${evento.clientX - contenedor.left - this.arrastreSecreto.offsetX}px`;
      this.dArrastrable.style.top = `${evento.clientY - contenedor.top - this.arrastreSecreto.offsetY}px`;
    });

    this.dArrastrable.addEventListener('pointerup', (evento) => {
      if (!this.arrastreSecreto || evento.pointerId !== this.arrastreSecreto.pointerId) return;
      const rectZona = this.zonaSecreta.getBoundingClientRect();
      const rectD = this.dArrastrable.getBoundingClientRect();
      const centroD = { x: rectD.left + rectD.width / 2, y: rectD.top + rectD.height / 2 };
      const soltadaEnZona = centroD.x >= rectZona.left && centroD.x <= rectZona.right &&
        centroD.y >= rectZona.top && centroD.y <= rectZona.bottom;
      limpiarArrastre();
      if (soltadaEnZona) {
        this.transicionSecretaIniciada = true;
        const rectLogo = this.logoSecreto.getBoundingClientRect();
        this.dArrastrable.style.left = `${rectZona.left + rectZona.width / 2 - rectD.width / 2 - rectLogo.left}px`;
        this.dArrastrable.style.top = `${rectZona.top + rectZona.height / 2 - rectD.height / 2 - rectLogo.top}px`;
        this.pantallaInicio.classList.add('animacion-secreta');
        sessionStorage.setItem('microrécords_descubrimiento_secreto_pendiente', 'true');
        window.setTimeout(() => {
          window.location.href = '../Microjuegos/desenterrandotesoros/index.html';
        }, 1800);
        return;
      }
      this.dArrastrable.style.removeProperty('left');
      this.dArrastrable.style.removeProperty('top');
    });

    this.dArrastrable.addEventListener('dragstart', (evento) => evento.preventDefault());
  }

  async registrarSecretoAlRegresar() {
    const clave = 'microrécords_descubrimiento_secreto_pendiente';
    if (sessionStorage.getItem(clave) !== 'true') return;

    try {
      const respuesta = await fetch(`${this.urlApi}?accion=descubrir_secreto`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || datos.status !== 'success') {
        throw new Error(datos.mensaje || 'No se pudo registrar el descubrimiento secreto.');
      }
      if (!datos.autenticado || !datos.logros) return;

      sessionStorage.removeItem(clave);
      this.usuarioActual = { ...(this.usuarioActual || {}), logros: datos.logros };
      localStorage.setItem(this.claveStorage, JSON.stringify(this.usuarioActual));
      this.actualizarIndicadoresLogros(datos.logros);
      if (datos.logros.desbloqueados.includes('desenterrando_secretos')) {
        this.mostrarNotificacionLogro('Desenterrando secretos', 'Encuentra el minijuego secreto.');
      }
    } catch (error) {
      console.error('No se pudo registrar el descubrimiento secreto al volver al menú:', error);
    }
  }

  mostrarNotificacionLogro(nombre, descripcion) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'notificacion-logro';
    const titulo = document.createElement('strong');
    titulo.textContent = nombre;
    const texto = document.createElement('span');
    texto.textContent = descripcion;
    tarjeta.append(titulo, texto);
    this.contenedorNotificaciones.appendChild(tarjeta);
    window.setTimeout(() => {
      tarjeta.classList.add('saliendo');
      tarjeta.addEventListener('animationend', () => tarjeta.remove(), { once: true });
    }, 2800);
  }

  renderizarLogrosCuenta(logros) {
    const desbloqueados = Array.isArray(logros?.desbloqueados) ? logros.desbloqueados : [];
    this.detalleCuentaLogros.replaceChildren();

    const tarjetasLogros = Array.from(
      this.pantallaLogros.querySelectorAll('[data-logro-id]')
    );
    const conseguidos = tarjetasLogros.filter((tarjeta) =>
      desbloqueados.includes(tarjeta.dataset.logroId)
    );
    if (conseguidos.length === 0) {
      const mensaje = document.createElement('p');
      mensaje.className = 'logros-vacios';
      mensaje.textContent = 'Todavía no consiguió logros.';
      this.detalleCuentaLogros.appendChild(mensaje);
      return;
    }

    conseguidos.forEach((tarjetaOriginal) => {
      const tarjeta = tarjetaOriginal.cloneNode(true);
      tarjeta.hidden = false;
      const indicador = tarjeta.querySelector('.logro-indicador');
      indicador.classList.add('desbloqueado');
      indicador.setAttribute('aria-label', 'Desbloqueado');
      indicador.title = 'Desbloqueado';
      this.detalleCuentaLogros.appendChild(tarjeta);
    });
  }

  mostrarPantalla(pantallaActiva) {
    [
      this.pantallaInicio,
      this.pantallaLogros,
      this.pantallaAuth,
      this.pantallaCuenta,
      this.pantallaPosiciones,
      this.pantallaIntro
    ].forEach((pantalla) => pantalla.classList.add(this.claseOculta));
    pantallaActiva.classList.remove(this.claseOculta);
  }

  /**
   * Método original para navegar al juego.
   * Reinicia la racha actual a 0 al comenzar una nueva partida.
   */
  async irAlJuego() {
    try {
      await fetch(`${this.urlApi}?accion=reiniciar_racha`, { method: 'POST' });
    } catch (e) {
      // Continuar al juego incluso si falla la petición
    }
    const microjuegos = [
      'atraparmariposa',
      'duelodemiradas',
      'torre%20de%20sombreros',
      'comerlapizza',
      'esquivalosproyectiles'
    ];
    const microjuego = microjuegos[Math.floor(Math.random() * microjuegos.length)];
    window.location.href = `../Microjuegos/${microjuego}/index.html`;
  }

  // --------------------------------------------------------------------------
  // GESTIÓN DE SESIÓN (RECORDAR Y RECONOCER USUARIO)
  // --------------------------------------------------------------------------

  /**
   * Carga la sesión guardada desde localStorage y la revalida con el backend PHP.
   * Esto garantiza que la sesión se recuerde al reiniciar o cerrar la página.
   */
  async cargarSesionRecordada() {
    // 1. Intentar restaurar sesión de forma instantánea desde localStorage
    const sesionLocal = localStorage.getItem(this.claveStorage);
    if (sesionLocal) {
      try {
        const usuario = JSON.parse(sesionLocal);
        if (usuario && usuario.nombre) {
          this.usuarioActual = usuario;
          this.actualizarUIUsuario();
        }
      } catch (error) {
        console.error('Error al analizar la sesión local:', error);
      }
    }

    // 2. Revalidar con el servidor PHP para obtener datos actualizados (ej. récord / puntuación)
    try {
      const respuesta = await fetch(`${this.urlApi}?accion=verificar_sesion`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        if (datos.status === 'success' && datos.autenticado && datos.usuario) {
          // El servidor confirma la sesión activa
          this.usuarioActual = datos.usuario;
          localStorage.setItem(this.claveStorage, JSON.stringify(datos.usuario));
          this.actualizarUIUsuario();
        } else if (!datos.autenticado && !sesionLocal) {
          // Sin sesión activa
          this.usuarioActual = null;
          this.actualizarUIUsuario();
        }
      }
    } catch (e) {
      // Si el servidor local está desconectado temporalmente, mantenemos la sesión de localStorage
      console.warn('No se pudo sincronizar la sesión con el servidor PHP:', e);
    }
    await this.registrarSecretoAlRegresar();
  }

  /**
   * Actualiza los datos visibles en la pantalla de cuenta.
   */
  actualizarUIUsuario() {
    if (this.usuarioActual) {
      // Rellenar datos en la pantalla de cuenta
      if (this.cuentaNombre) {
        this.cuentaNombre.textContent = this.usuarioActual.nombre;
      }
    }
    this.actualizarIndicadoresLogros(this.usuarioActual?.logros);
  }

  actualizarIndicadoresLogros(logros) {
    const desbloqueados = Array.isArray(logros?.desbloqueados) ? logros.desbloqueados : [];
    this.pantallaLogros.querySelectorAll('[data-logro-id]').forEach((articulo) => {
      const indicador = articulo.querySelector('.logro-indicador');
      const estaDesbloqueado = desbloqueados.includes(articulo.dataset.logroId);
      if (articulo.dataset.logroId === 'desenterrando_secretos') {
        articulo.hidden = !estaDesbloqueado;
      }
      indicador.classList.toggle('desbloqueado', estaDesbloqueado);
      indicador.setAttribute('aria-label', estaDesbloqueado ? 'Desbloqueado' : 'No desbloqueado');
      indicador.title = estaDesbloqueado ? 'Desbloqueado' : 'No desbloqueado';
    });
  }

  // --------------------------------------------------------------------------
  // NAVEGACIÓN DENTRO DE LA MISMA PÁGINA (PANTALLA DE CUENTA Y AUTH)
  // --------------------------------------------------------------------------

  /**
   * Se ejecuta al pulsar el botón "Cuenta".
   * - Si ya inició sesión: muestra directamente la pantalla con su cuenta.
   * - Si no ha iniciado sesión: muestra la pantalla para iniciar sesión o registrarse.
   */
  abrirPantallaCuenta() {
    this.ocultarMensajeAuth();

    if (this.usuarioActual) {
      // Ya tiene sesión iniciada: mostrar pantalla con su cuenta
      this.actualizarUIUsuario();
      this.mostrarPantalla(this.pantallaCuenta);
    } else {
      // No ha iniciado sesión: mostrar pantalla de autenticación
      this.mostrarPantalla(this.pantallaAuth);
      this.cambiarTab('login');
    }
  }

  /**
   * Regresa al menú principal (pantalla de inicio #estart).
   */
  volverAlMenu() {
    window.clearTimeout(this.temporizadorEmpezar);
    this.botonEmpezar.classList.add(this.claseOculta);
    this.mostrarPantalla(this.pantallaInicio);
    this.ocultarMensajeAuth();
  }

  /**
   * Alterna entre las pestañas de "Iniciar Sesión" y "Registrarse".
   * 
   * @param {'login'|'registro'} tab Nombre de la pestaña seleccionada.
   */
  cambiarTab(tab) {
    this.ocultarMensajeAuth();
    if (tab === 'login') {
      this.tabLogin.classList.add('activa');
      this.tabRegistro.classList.remove('activa');
      this.formLogin.classList.remove(this.claseOculta);
      this.formRegistro.classList.add(this.claseOculta);
      if (this.authTitulo) this.authTitulo.textContent = 'Iniciar Sesión';
    } else {
      this.tabRegistro.classList.add('activa');
      this.tabLogin.classList.remove('activa');
      this.formRegistro.classList.remove(this.claseOculta);
      this.formLogin.classList.add(this.claseOculta);
      if (this.authTitulo) this.authTitulo.textContent = 'Registrarse';
    }
  }

  // --------------------------------------------------------------------------
  // PROCESAMIENTO DE AUTENTICACIÓN (PHP + MYSQL)
  // --------------------------------------------------------------------------

  /**
   * Procesa el formulario de Inicio de Sesión conectando con PHP.
   * 
   * @param {Event} e Evento de envío de formulario.
   */
  async procesarLogin(e) {
    e.preventDefault();
    this.ocultarMensajeAuth();

    // Comprobar si se abrió el archivo como file:// en lugar de localhost (WAMP)
    if (window.location.protocol === 'file:') {
      this.mostrarMensajeAuth('Debes abrir el juego desde tu servidor WAMP (ej: http://localhost/Microrécords/) para conectar con PHP y MySQL.', 'error');
      return;
    }

    const nombre = document.getElementById('login-usuario').value.trim();
    const contrasena = document.getElementById('login-password').value;

    if (!nombre || !contrasena) {
      this.mostrarMensajeAuth('Por favor complete todos los campos.', 'error');
      return;
    }

    try {
      const respuesta = await fetch(`${this.urlApi}?accion=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre, contraseña: contrasena })
      });

      let datos;
      try {
        datos = await respuesta.json();
      } catch (jsonErr) {
        console.error('Respuesta no válida del servidor:', jsonErr);
        this.mostrarMensajeAuth('El servidor PHP no devolvió una respuesta válida.', 'error');
        return;
      }

      if (respuesta.ok && datos.status === 'success') {
        // Guardar sesión en el estado y en localStorage para persistencia
        this.usuarioActual = datos.usuario;
        localStorage.setItem(this.claveStorage, JSON.stringify(datos.usuario));

        // Actualizar datos y mostrar pantalla con su cuenta
        this.actualizarUIUsuario();
        this.pantallaAuth.classList.add(this.claseOculta);
        this.pantallaCuenta.classList.remove(this.claseOculta);

        // Limpiar el formulario
        this.formLogin.reset();
      } else {
        this.mostrarMensajeAuth(datos.mensaje || 'Error al iniciar sesión.', 'error');
      }
    } catch (error) {
      console.error('Error de red al iniciar sesión:', error);
      this.mostrarMensajeAuth('No se pudo conectar con el servidor PHP.', 'error');
    }
  }

  /**
   * Procesa el formulario de Registro conectando con PHP.
   * 
   * @param {Event} e Evento de envío de formulario.
   */
  async procesarRegistro(e) {
    e.preventDefault();
    this.ocultarMensajeAuth();

    // Comprobar si se abrió el archivo como file:// en lugar de localhost (WAMP)
    if (window.location.protocol === 'file:') {
      this.mostrarMensajeAuth('Debes abrir el juego desde tu servidor WAMP (ej: http://localhost/Microrécords/) para conectar con PHP y MySQL.', 'error');
      return;
    }

    const nombre = document.getElementById('registro-usuario').value.trim();
    const contrasena = document.getElementById('registro-password').value;

    if (!nombre || !contrasena) {
      this.mostrarMensajeAuth('Por favor complete todos los campos.', 'error');
      return;
    }

    try {
      const respuesta = await fetch(`${this.urlApi}?accion=registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre, contraseña: contrasena })
      });

      let datos;
      try {
        datos = await respuesta.json();
      } catch (jsonErr) {
        console.error('Respuesta no válida del servidor:', jsonErr);
        this.mostrarMensajeAuth('El servidor PHP no devolvió una respuesta válida.', 'error');
        return;
      }

      if (respuesta.ok && datos.status === 'success') {
        // Guardar la sesión automáticamente tras registrarse
        this.usuarioActual = datos.usuario;
        localStorage.setItem(this.claveStorage, JSON.stringify(datos.usuario));

        // Actualizar datos y mostrar pantalla con su cuenta
        this.actualizarUIUsuario();
        this.pantallaAuth.classList.add(this.claseOculta);
        this.pantallaCuenta.classList.remove(this.claseOculta);

        // Limpiar el formulario
        this.formRegistro.reset();
      } else {
        this.mostrarMensajeAuth(datos.mensaje || 'Error al registrar el usuario.', 'error');
      }
    } catch (error) {
      console.error('Error de red al registrarse:', error);
      this.mostrarMensajeAuth('No se pudo conectar con el servidor PHP.', 'error');
    }
  }

  /**
   * Cierra la sesión activa en el servidor PHP y en el cliente.
   */
  async cerrarSesion() {
    try {
      await fetch(`${this.urlApi}?accion=logout`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
    } catch (error) {
      console.warn('Error al notificar cierre de sesión al servidor:', error);
    }

    // Limpiar almacenamiento local y estado
    localStorage.removeItem(this.claveStorage);
    this.usuarioActual = null;
    this.actualizarUIUsuario();

    // Regresar al menú de inicio
    this.volverAlMenu();
  }

  async eliminarCuenta() {
    if (!this.usuarioActual) {
      window.alert('Inicia sesión para eliminar tu cuenta.');
      return;
    }

    const confirmado = window.confirm(
      '¿Eliminar permanentemente tu cuenta y todos sus datos? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    this.botonEliminarCuenta.disabled = true;
    try {
      const respuesta = await fetch(`${this.urlApi}?accion=eliminar_cuenta`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || datos.status !== 'success') {
        throw new Error(datos.mensaje || 'No se pudo eliminar la cuenta.');
      }

      localStorage.removeItem(this.claveStorage);
      this.usuarioActual = null;
      this.actualizarUIUsuario();
      this.volverAlMenu();
      window.alert('La cuenta y sus datos fueron eliminados.');
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      window.alert(error.message || 'No se pudo conectar con el servidor.');
    } finally {
      this.botonEliminarCuenta.disabled = false;
    }
  }

  /**
   * Muestra mensajes de error o éxito en el panel de autenticación.
   * 
   * @param {string} mensaje Texto a mostrar.
   * @param {'error'|'exito'} tipo Clase visual del mensaje.
   */
  mostrarMensajeAuth(mensaje, tipo = 'error') {
    if (!this.authMensaje) return;
    this.authMensaje.textContent = mensaje;
    this.authMensaje.className = `auth-mensaje ${tipo}`;
    this.authMensaje.classList.remove(this.claseOculta);
  }

  /**
   * Oculta la caja de mensajes de autenticación.
   */
  ocultarMensajeAuth() {
    if (!this.authMensaje) return;
    this.authMensaje.textContent = '';
    this.authMensaje.className = 'auth-mensaje';
    this.authMensaje.classList.add(this.claseOculta);
  }
}

function arrancarInterfaz() {
  const miJuego = new Juego();
  miJuego.init();

  const audio = document.getElementById("musica");
  if (audio) {
    audio.loop = true;
    audio.muted = localStorage.getItem('microrécords_silencio') === 'true';

    document.addEventListener("click", function iniciarMusica() {
      audio.play().catch(e => console.log("Reproducción de audio pospuesta:", e));
      document.removeEventListener("click", iniciarMusica);
    });
  }

  document.addEventListener('keydown', (evento) => {
    const elementoActivo = document.activeElement;
    if (
      evento.key.toLowerCase() !== 'm' ||
      evento.altKey ||
      evento.ctrlKey ||
      evento.metaKey ||
      elementoActivo.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(elementoActivo.tagName)
    ) {
      return;
    }

    const silenciar = localStorage.getItem('microrécords_silencio') !== 'true';
    localStorage.setItem('microrécords_silencio', String(silenciar));
    document.querySelectorAll('audio, video').forEach((medio) => {
      medio.muted = silenciar;
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancarInterfaz);
} else {
  arrancarInterfaz();
}
