<?php
declare(strict_types=1);

require_once __DIR__ . '/../Configuración/Config.php';

class UsuarioModelo {
    private PDO $pdo;
    private string $colIdUsuario = 'id_usuario';

    public function __construct(?PDO $pdo = null) {
        $this->pdo = $pdo ?? Conexion::obtenerConexion();
        $this->detectarColumnaIdUsuario();
    }

    private function detectarColumnaIdUsuario(): void {
        try {
            $stmt = $this->pdo->query("DESCRIBE `usuarios`");
            $columnas = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('id_usuario', $columnas, true)) {
                $this->colIdUsuario = 'id_usuario';
            } elseif (in_array('id-usuario', $columnas, true)) {
                $this->colIdUsuario = 'id-usuario';
            }
        } catch (Throwable $e) {
            $this->colIdUsuario = 'id_usuario';
        }
    }

    public function registrar(string $nombre, string $contrasena, int $idInfor): array {
        $nombre = trim($nombre);
        $hashContrasena = password_hash($contrasena, PASSWORD_DEFAULT);

        $stmtUsuario = $this->pdo->prepare("
            INSERT INTO `usuarios` (`nombre`, `contraseña`, `id-infor`) 
            VALUES (?, ?, ?);
        ");
        $stmtUsuario->execute([$nombre, $hashContrasena, $idInfor]);
        $idUsuario = (int)$this->pdo->lastInsertId();

        return [
            'id-usuario' => $idUsuario,
            'id_usuario' => $idUsuario,
            'nombre' => $nombre,
            'id-infor' => $idInfor
        ];
    }

    public function existeNombre(string $nombre): bool {
        $sqlExiste = "SELECT `{$this->colIdUsuario}` FROM `usuarios` WHERE `nombre` = ?;";
        $stmtExiste = $this->pdo->prepare($sqlExiste);
        $stmtExiste->execute([$nombre]);
        return (bool)$stmtExiste->fetch();
    }

    public function iniciarSesion(string $nombre, string $contrasena): array {
        $nombre = trim($nombre);
        if (empty($nombre) || trim($contrasena) === '') {
            throw new InvalidArgumentException("Por favor ingrese su usuario y contraseña.");
        }

        $sql = "
            SELECT 
                u.`{$this->colIdUsuario}` AS `id_usuario_val`,
                u.`nombre`, 
                u.`contraseña`, 
                u.`id-infor`, 
                i.`puntuación`,
                i.`logros`
            FROM `usuarios` AS u
            LEFT JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
            WHERE u.`nombre` = ?;
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$nombre]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            throw new RuntimeException("El usuario '{$nombre}' no existe.");
        }

        $hashGuardado = (string)$usuario['contraseña'];
        $esValida = password_verify($contrasena, $hashGuardado);

        if (!$esValida && hash_equals($hashGuardado, $contrasena)) {
            $hashGuardado = password_hash($contrasena, PASSWORD_DEFAULT);
            $stmtActualizar = $this->pdo->prepare(
                "UPDATE `usuarios` SET `contraseña` = ? WHERE `{$this->colIdUsuario}` = ?;"
            );
            $stmtActualizar->execute([$hashGuardado, (int)$usuario['id_usuario_val']]);
            $esValida = true;
        }

        if (!$esValida) {
            throw new RuntimeException("La contraseña ingresada es incorrecta.");
        }

        $id = (int)$usuario['id_usuario_val'];
        $puntuacion = (int)($usuario['puntuación'] ?? 0);

        return [
            'id-usuario' => $id,
            'id_usuario' => $id,
            'nombre' => $usuario['nombre'],
            'id-infor' => (int)$usuario['id-infor'],
            'puntuación' => $puntuacion,
            'puntuacion' => $puntuacion,
            'logros' => json_decode($usuario['logros'] ?? '{}', true) ?: ['desbloqueados' => [], 'microjuegos_jugados' => [], 'total_microjuegos' => 0]
        ];
    }

    public function obtenerPorId(int $idUsuario): ?array {
        $sql = "
            SELECT 
                u.`{$this->colIdUsuario}` AS `id_usuario_val`,
                u.`nombre`, 
                u.`id-infor`, 
                i.`puntuación`,
                i.`logros`
            FROM `usuarios` AS u
            LEFT JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
            WHERE u.`{$this->colIdUsuario}` = ?;
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$idUsuario]);
        $resultado = $stmt->fetch();

        if (!$resultado) {
            return null;
        }

        $id = (int)$resultado['id_usuario_val'];
        $puntuacion = (int)($resultado['puntuación'] ?? 0);

        return [
            'id-usuario' => $id,
            'id_usuario' => $id,
            'nombre' => $resultado['nombre'],
            'id-infor' => (int)$resultado['id-infor'],
            'puntuación' => $puntuacion,
            'puntuacion' => $puntuacion,
            'logros' => json_decode($resultado['logros'] ?? '{}', true) ?: ['desbloqueados' => [], 'microjuegos_jugados' => [], 'total_microjuegos' => 0]
        ];
    }

    public function obtenerIdInforPorUsuario(int $idUsuario) {
        $stmtInfo = $this->pdo->prepare(
            "SELECT `id-infor` FROM `usuarios` WHERE `{$this->colIdUsuario}` = ? FOR UPDATE;"
        );
        $stmtInfo->execute([$idUsuario]);
        return $stmtInfo->fetchColumn();
    }

    public function eliminarCuenta(int $idUsuario): void {
        $stmtUsuario = $this->pdo->prepare(
            "DELETE FROM `usuarios` WHERE `{$this->colIdUsuario}` = ?;"
        );
        $stmtUsuario->execute([$idUsuario]);
    }

    public function obtenerColIdUsuario(): string {
        return $this->colIdUsuario;
    }

    public function getPdo(): PDO {
        return $this->pdo;
    }
}