<?php
declare(strict_types=1);

require_once __DIR__ . '/../Modelos/InformacionModelo.php';
require_once __DIR__ . '/../Modelos/UsuarioModelo.php';

class InformacionControlador {
    private InformacionModelo $informacionModelo;
    private UsuarioModelo $usuarioModelo;

    public function __construct() {
        $this->informacionModelo = new InformacionModelo();
        $this->usuarioModelo = new UsuarioModelo();
    }

    public function procesarAccion(string $accion, array $parametros): void {
        switch ($accion) {
            case 'tabla_posiciones':
                echo json_encode([
                    'status' => 'success',
                    'posiciones' => $this->informacionModelo->obtenerTablaPosiciones($this->usuarioModelo->obtenerColIdUsuario())
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'descubrir_secreto':
                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                if ($idUsuario === 0) {
                    echo json_encode([
                        'status' => 'success',
                        'autenticado' => false,
                        'mensaje' => 'Inicia sesión para guardar el logro secreto.'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $resultado = $this->informacionModelo->registrarDescubrimientoSecreto($idUsuario, $this->usuarioModelo->obtenerColIdUsuario());
                $_SESSION['usuario']['logros'] = $resultado['logros'];
                echo json_encode([
                    'status' => 'success',
                    'autenticado' => true,
                    'logros' => $resultado['logros'],
                    'logros_nuevos' => $resultado['logros_nuevos']
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'iniciar_microjuego':
                $microjuego = (string)($parametros['microjuego'] ?? '');
                $microjuegos = [
                    'atraparmariposa',
                    'duelodemiradas',
                    'torredesombreros',
                    'comerlapizza',
                    'esquivalosproyectiles'
                ];
                if (!in_array($microjuego, $microjuegos, true)) {
                    throw new InvalidArgumentException('El identificador del microjuego no es válido.');
                }
                $intentos = $_SESSION['intentos_microjuego'] ?? [];
                $ahora = time();
                foreach ($intentos as $token => $intento) {
                    if (($intento['creado'] ?? 0) < $ahora - 1800) {
                        unset($intentos[$token]);
                    }
                }
                $token = bin2hex(random_bytes(16));
                $intentos[$token] = ['microjuego' => $microjuego, 'creado' => $ahora];
                $_SESSION['intentos_microjuego'] = $intentos;
                echo json_encode(['status' => 'success', 'intento' => $token], JSON_UNESCAPED_UNICODE);
                break;

            case 'finalizar_microjuego':
                $microjuego = (string)($parametros['microjuego'] ?? '');
                $token = (string)($parametros['intento'] ?? '');
                $intentos = $_SESSION['intentos_microjuego'] ?? [];
                if ($token === '' || !isset($intentos[$token]) ||
                    ($intentos[$token]['microjuego'] ?? '') !== $microjuego) {
                    throw new InvalidArgumentException('El intento del microjuego no existe o ya fue utilizado.');
                }
                unset($intentos[$token]);
                $_SESSION['intentos_microjuego'] = $intentos;

                $victoria = filter_var($parametros['victoria'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                $_SESSION['racha_actual'] = (int)($_SESSION['racha_actual'] ?? 0);
                if ($idUsuario > 0 && $victoria) {
                    $_SESSION['racha_actual']++;
                } elseif (!$victoria) {
                    $_SESSION['racha_actual'] = 0;
                }

                if ($idUsuario > 0) {
                    $resultado = $this->informacionModelo->registrarMicrojuegoTerminado(
                        $idUsuario,
                        $this->usuarioModelo->obtenerColIdUsuario(),
                        $microjuego,
                        $victoria,
                        (int)$_SESSION['racha_actual']
                    );
                    $_SESSION['usuario']['puntuación'] = $resultado['puntuación'];
                    $_SESSION['usuario']['puntuacion'] = $resultado['puntuación'];
                    $_SESSION['usuario']['logros'] = $resultado['logros'];
                    echo json_encode([
                        'status' => 'success',
                        'autenticado' => true,
                        'puntuacion_actual' => (int)$_SESSION['racha_actual'],
                        'puntuacion_maxima' => $resultado['puntuación'],
                        'logros' => $resultado['logros'],
                        'logros_nuevos' => $resultado['logros_nuevos']
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode([
                        'status' => 'success',
                        'autenticado' => false,
                        'puntuacion_actual' => (int)$_SESSION['racha_actual'],
                        'mensaje' => 'Partida terminada; inicia sesión para guardar estadísticas y logros.'
                    ], JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'sumar_punto':
            case 'victoria':
            case 'superado':
                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                if ($idUsuario === 0 && !empty($parametros['id_usuario'])) {
                    $idUsuario = (int)$parametros['id_usuario'];
                }

                if ($idUsuario > 0) {
                    $_SESSION['racha_actual'] = (int)($_SESSION['racha_actual'] ?? 0) + 1;
                    $rachaActual = (int)$_SESSION['racha_actual'];

                    $usuarioObj = $this->usuarioModelo->obtenerPorId($idUsuario);
                    $recordMaximo = $this->informacionModelo->actualizarPuntuacionMaxima((int)$usuarioObj['id-infor'], $rachaActual, (int)$usuarioObj['puntuación']);
                    
                    $_SESSION['usuario']['puntuación'] = $recordMaximo;
                    $_SESSION['usuario']['puntuacion'] = $recordMaximo;

                    echo json_encode([
                        'status' => 'success',
                        'autenticado' => true,
                        'puntuacion_actual' => $rachaActual,
                        'puntuacion_maxima' => $recordMaximo,
                        'es_nuevo_record' => ($rachaActual >= $recordMaximo)
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode([
                        'status' => 'success',
                        'autenticado' => false,
                        'mensaje' => 'No hay sesión iniciada, puntuación no registrada.'
                    ], JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'reiniciar_racha':
            case 'derrota':
            case 'perder':
                $_SESSION['racha_actual'] = 0;

                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                $recordMaximo = 0;
                if ($idUsuario > 0) {
                    $usuario = $this->usuarioModelo->obtenerPorId($idUsuario);
                    $recordMaximo = (int)($usuario['puntuación'] ?? 0);
                }

                echo json_encode([
                    'status' => 'success',
                    'puntuacion_actual' => 0,
                    'puntuacion_maxima' => $recordMaximo,
                    'mensaje' => 'La racha se ha reiniciado a 0 al perder.'
                ], JSON_UNESCAPED_UNICODE);
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'mensaje' => 'Acción no especificada o no válida en información.'
                ], JSON_UNESCAPED_UNICODE);
                break;
        }
    }
}