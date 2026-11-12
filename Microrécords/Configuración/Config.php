<?php
declare(strict_types=1);

class Conexion {
    private static ?PDO $instancia = null;

    public static function cargarEntorno(): array {
        $rutasEnv = [
            __DIR__ . '/../.env',
            __DIR__ . '/../Visual/Menú/.env'
        ];
        $variables = [
            'Anfitrión' => 'localhost',
            'Usuario' => 'root',
            'Contraseña' => '',
            'Base_de_datos' => 'microrécords'
        ];

        foreach ($rutasEnv as $rutaEnv) {
            if (is_file($rutaEnv)) {
                $lineas = file($rutaEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lineas as $linea) {
                    $linea = trim($linea);
                    if ($linea === '' || str_starts_with($linea, '#')) {
                        continue;
                    }
                    $partes = explode('=', $linea, 2);
                    if (count($partes) === 2) {
                        $clave = trim($partes[0]);
                        $valor = trim($partes[1]);
                        $variables[$clave] = $valor;
                    }
                }
                break;
            }
        }
        return $variables;
    }

    public static function obtenerConexion(): PDO {
        if (self::$instancia === null) {
            $env = self::cargarEntorno();
            $host = $env['Anfitrión'] ?? 'localhost';
            $usuario = $env['Usuario'] ?? 'root';
            $contrasena = $env['Contraseña'] ?? '';
            $nombreBD = $env['Base_de_datos'] ?? 'microrécords';

            $opciones = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            try {
                $pdoInicial = new PDO("mysql:host={$host};charset=utf8mb4", $usuario, $contrasena, $opciones);
                $pdoInicial->exec("CREATE DATABASE IF NOT EXISTS `{$nombreBD}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                self::$instancia = new PDO("mysql:host={$host};dbname={$nombreBD};charset=utf8mb4", $usuario, $contrasena, $opciones);
                self::inicializarTablas(self::$instancia);
            } catch (PDOException $e) {
                error_log("Error de conexión a la base de datos: " . $e->getMessage());
                throw new PDOException("No se pudo conectar a la base de datos MySQL: " . $e->getMessage());
            }
        }
        return self::$instancia;
    }

    private static function inicializarTablas(PDO $pdo): void {
        $sqlInformacion = "
            CREATE TABLE IF NOT EXISTS `información` (
                `id-infor` INT AUTO_INCREMENT PRIMARY KEY,
                `puntuación` INT NOT NULL DEFAULT 0,
                `logros` JSON NULL DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $pdo->exec($sqlInformacion);

        $columnasInformacion = $pdo->query("DESCRIBE `información`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('logros', $columnasInformacion, true)) {
            $pdo->exec("ALTER TABLE `información` ADD COLUMN `logros` JSON NULL DEFAULT NULL;");
        }

        $sqlUsuarios = "
            CREATE TABLE IF NOT EXISTS `usuarios` (
                `id-usuario` INT AUTO_INCREMENT PRIMARY KEY,
                `nombre` VARCHAR(100) NOT NULL UNIQUE,
                `contraseña` VARCHAR(255) NOT NULL,
                `id-infor` INT NOT NULL,
                CONSTRAINT `fk_usuario_informacion` 
                    FOREIGN KEY (`id-infor`) 
                    REFERENCES `información`(`id-infor`) 
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $pdo->exec($sqlUsuarios);
    }
}