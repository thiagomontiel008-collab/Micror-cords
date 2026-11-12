<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    $rutaSesiones = session_save_path();
    if (!empty($rutaSesiones) && !@is_writable($rutaSesiones)) {
        @session_save_path(sys_get_temp_dir());
    }

    $tiempoVida = 60 * 60 * 24 * 30; // 30 días
    session_set_cookie_params([
        'lifetime' => $tiempoVida,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    ini_set('session.gc_maxlifetime', (string)$tiempoVida);
    @session_start();
}

require_once __DIR__ . '/../Controladores/UsuarioControlador.php';
require_once __DIR__ . '/../Controladores/InformacionControlador.php';

function obtenerParametrosEntrada(): array {
    $datos = [];
    $cuerpoBruto = file_get_contents('php://input');
    if (!empty($cuerpoBruto)) {
        $jsonDecodificado = json_decode($cuerpoBruto, true);
        if (is_array($jsonDecodificado)) {
            $datos = $jsonDecodificado;
        }
    }
    return array_merge($_GET, $_POST, $datos);
}

$parametros = obtenerParametrosEntrada();
$accion = strtolower(trim((string)($parametros['accion'] ?? '')));

// Definir qué acciones pertenecen a Usuario y cuáles a Información
$accionesInformacion = [
    'tabla_posiciones', 'descubrir_secreto', 'iniciar_microjuego', 
    'finalizar_microjuego', 'sumar_punto', 'victoria', 'superado', 
    'reiniciar_racha', 'derrota', 'perder'
];

try {
    if (in_array($accion, $accionesInformacion, true)) {
        $controlador = new InformacionControlador();
    } else {
        $controlador = new UsuarioControlador();
    }
    $controlador->procesarAccion($accion, $parametros);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'Error en el servidor: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}