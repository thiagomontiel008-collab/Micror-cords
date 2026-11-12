<?php
declare(strict_types=1);

require_once __DIR__ . '/../Modelos/UsuarioModelo.php';
require_once __DIR__ . '/../Modelos/InformacionModelo.php';

class UsuarioControlador {
    private UsuarioModelo $usuarioModelo;
    private InformacionModelo $informacionModelo;

    public function __construct() {
        $this->usuarioModelo = new UsuarioModelo();
        $this->informacionModelo = new InformacionModelo();
    }

    public function procesarAccion(string $accion, array $parametros): void {
        switch ($accion) {
            case 'registro':
            case 'registrar':
                $nombre = (string)($parametros['nombre'] ?? $parametros['usuario'] ?? '');
                $contrasena = (string)($parametros['contraseña'] ?? $parametros['contrasena'] ?? $parametros['password'] ?? '');

                if (empty($nombre) || trim($contrasena) === '') {
                    throw new InvalidArgumentException("El nombre y la contraseña no pueden estar vacíos.");
                }
                if (mb_strlen($nombre) < 3) {
                    throw new InvalidArgumentException("El nombre de usuario debe tener al menos 3 caracteres.");
                }
                if (mb_strlen($contrasena) < 4) {
                    throw new InvalidArgumentException("La contraseña debe tener al menos 4 caracteres.");
                }

                if ($this->usuarioModelo->existeNombre($nombre)) {
                    throw new RuntimeException("El nombre de usuario '{$nombre}' ya está en uso.");
                }

                $pdo = $this->usuarioModelo->getPdo();
                $pdo->beginTransaction();
                try {
                    $idInfor = $this->informacionModelo->crearRegistroInicial();
                    $nuevoUsuario = $this->usuarioModelo->registrar($nombre, $contrasena, $idInfor);
                    $pdo->commit();

                    $nuevoUsuario['puntuación'] = 0;
                    $nuevoUsuario['puntuacion'] = 0;
                    $nuevoUsuario['logros'] = [
                        'desbloqueados' => [],
                        'microjuegos_jugados' => [],
                        'total_microjuegos' => 0
                    ];

                    $_SESSION['usuario'] = $nuevoUsuario;
                    $_SESSION['racha_actual'] = 0;

                    echo json_encode([
                        'status' => 'success',
                        'usuario' => $nuevoUsuario
                    ], JSON_UNESCAPED_UNICODE);
                } catch (Throwable $e) {
                    if ($pdo->inTransaction()) { $pdo->rollBack(); }
                    throw new RuntimeException("Error al registrar el usuario: " . $e->getMessage(), 0, $e);
                }
                break;

            case 'login':
            case 'iniciar_sesion':
                $nombre = (string)($parametros['nombre'] ?? $parametros['usuario'] ?? '');
                $contrasena = (string)($parametros['contraseña'] ?? $parametros['contrasena'] ?? $parametros['password'] ?? '');

                $usuario = $this->usuarioModelo->iniciarSesion($nombre, $contrasena);
                $_SESSION['usuario'] = $usuario;
                $_SESSION['racha_actual'] = 0;

                echo json_encode([
                    'status' => 'success',
                    'usuario' => $usuario
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'verificar':
            case 'verificar_sesion':
            case 'check_session':
                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);

                if ($idUsuario > 0) {
                    $usuarioActualizado = $this->usuarioModelo->obtenerPorId($idUsuario);
                    if ($usuarioActualizado !== null) {
                        $_SESSION['usuario'] = $usuarioActualizado;
                        echo json_encode([
                            'status' => 'success',
                            'autenticado' => true,
                            'usuario' => $usuarioActualizado,
                            'racha_actual' => (int)($_SESSION['racha_actual'] ?? 0)
                        ], JSON_UNESCAPED_UNICODE);
                        return;
                    }
                }

                $idFallback = (int)($parametros['id_usuario'] ?? $parametros['id-usuario'] ?? 0);
                if ($idFallback > 0) {
                    $usuario = $this->usuarioModelo->obtenerPorId($idFallback);
                    if ($usuario !== null) {
                        $_SESSION['usuario'] = $usuario;
                        echo json_encode([
                            'status' => 'success',
                            'autenticado' => true,
                            'usuario' => $usuario,
                            'racha_actual' => (int)($_SESSION['racha_actual'] ?? 0)
                        ], JSON_UNESCAPED_UNICODE);
                        return;
                    }
                }

                echo json_encode([
                    'status' => 'success',
                    'autenticado' => false,
                    'usuario' => null,
                    'racha_actual' => 0
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'cuenta':
            case 'obtener_cuenta':
                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                if ($idUsuario === 0) {
                    http_response_code(401);
                    echo json_encode([
                        'status' => 'error',
                        'mensaje' => 'No hay una sesión iniciada.'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $usuario = $this->usuarioModelo->obtenerPorId($idUsuario);
                echo json_encode([
                    'status' => 'success',
                    'usuario' => $usuario,
                    'racha_actual' => (int)($_SESSION['racha_actual'] ?? 0)
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'cuenta_publica':
                $idUsuario = (int)($parametros['id_usuario'] ?? 0);
                if ($idUsuario < 1) {
                    throw new InvalidArgumentException('El ID de cuenta no es válido.');
                }
                $usuario = $this->usuarioModelo->obtenerPorId($idUsuario);
                if ($usuario === null) {
                    http_response_code(404);
                    echo json_encode([
                        'status' => 'error',
                        'mensaje' => 'No se encontró la cuenta seleccionada.'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }
                $idUsuarioActual = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                $logros = $usuario['logros'];
                if ($idUsuarioActual !== $idUsuario) {
                    $logros['desbloqueados'] = array_values(array_filter(
                        $logros['desbloqueados'],
                        static fn(string $idLogro): bool => $idLogro !== 'desenterrando_secretos'
                    ));
                }
                echo json_encode([
                    'status' => 'success',
                    'usuario' => [
                        'id-usuario' => $usuario['id-usuario'],
                        'id-infor' => $usuario['id-infor'],
                        'nombre' => $usuario['nombre'],
                        'puntuación' => $usuario['puntuación'],
                        'logros' => $logros
                    ]
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'logout':
            case 'cerrar_sesion':
                $_SESSION = [];
                if (ini_get("session.use_cookies")) {
                    $params = session_get_cookie_params();
                    setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
                }
                @session_destroy();
                echo json_encode([
                    'status' => 'success',
                    'mensaje' => 'Sesión cerrada correctamente.'
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'eliminar_cuenta':
                if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                    http_response_code(405);
                    header('Allow: POST');
                    echo json_encode([
                        'status' => 'error',
                        'mensaje' => 'Esta acción requiere una solicitud POST.'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $idUsuario = (int)($_SESSION['usuario']['id_usuario'] ?? $_SESSION['usuario']['id-usuario'] ?? 0);
                if ($idUsuario < 1) {
                    http_response_code(401);
                    echo json_encode([
                        'status' => 'error',
                        'mensaje' => 'Inicia sesión para eliminar tu cuenta.'
                    ], JSON_UNESCAPED_UNICODE);
                    break;
                }

                $pdo = $this->usuarioModelo->getPdo();
                $pdo->beginTransaction();
                try {
                    $idInfor = $this->usuarioModelo->obtenerIdInforPorUsuario($idUsuario);
                    if ($idInfor === false) {
                        throw new RuntimeException('No se encontró la cuenta que deseas eliminar.');
                    }

                    $this->usuarioModelo->eliminarCuenta($idUsuario);
                    $this->informacionModelo->eliminarInformacionHuerfana((int)$idInfor);
                    $pdo->commit();
                } catch (Throwable $e) {
                    if ($pdo->inTransaction()) { $pdo->rollBack(); }
                    throw $e;
                }

                $_SESSION = [];
                if (ini_get('session.use_cookies')) {
                    $params = session_get_cookie_params();
                    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
                }
                session_destroy();

                echo json_encode([
                    'status' => 'success',
                    'mensaje' => 'La cuenta y sus datos fueron eliminados.'
                ], JSON_UNESCAPED_UNICODE);
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'mensaje' => 'Acción no especificada o no válida.'
                ], JSON_UNESCAPED_UNICODE);
                break;
        }
    }
}