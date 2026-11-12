<?php
declare(strict_types=1);

require_once __DIR__ . '/../Configuración/Config.php';

class InformacionModelo {
    private PDO $pdo;

    public function __construct(?PDO $pdo = null) {
        $this->pdo = $pdo ?? Conexion::obtenerConexion();
    }

    public function crearRegistroInicial(): int {
        $stmtInfo = $this->pdo->prepare("INSERT INTO `información` (`puntuación`) VALUES (0);");
        $stmtInfo->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function actualizarPuntuacionMaxima(int $idInfor, int $nuevaPuntuacion, int $recordActual): int {
        if ($nuevaPuntuacion > $recordActual) {
            $sql = "UPDATE `información` SET `puntuación` = ? WHERE `id-infor` = ?;";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$nuevaPuntuacion, $idInfor]);
            return $nuevaPuntuacion;
        }
        return $recordActual;
    }

    public function obtenerTablaPosiciones(string $colIdUsuario): array {
        $sql = "
            SELECT
                u.`nombre`,
                u.`{$colIdUsuario}` AS `id_usuario`,
                COALESCE(i.`puntuación`, 0) AS `puntuación`
            FROM `usuarios` AS u
            LEFT JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
            ORDER BY `puntuación` DESC, u.`nombre` ASC;
        ";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function eliminarInformacionHuerfana(int $idInfor): void {
        $stmtInformacion = $this->pdo->prepare("
            DELETE FROM `información`
            WHERE `id-infor` = ?
              AND NOT EXISTS (
                  SELECT 1 FROM `usuarios` WHERE `id-infor` = ?
              );
        ");
        $stmtInformacion->execute([$idInfor, $idInfor]);
    }

    public function registrarDescubrimientoSecreto(int $idUsuario, string $colIdUsuario): array {
        $this->pdo->beginTransaction();
        try {
            $sqlInfo = "
                SELECT i.`id-infor`, i.`logros`
                FROM `usuarios` AS u
                JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
                WHERE u.`{$colIdUsuario}` = ?
                FOR UPDATE;
            ";
            $stmtInfo = $this->pdo->prepare($sqlInfo);
            $stmtInfo->execute([$idUsuario]);
            $informacion = $stmtInfo->fetch();
            if (!$informacion) {
                throw new RuntimeException('No se encontró la cuenta para registrar el logro secreto.');
            }

            $logros = $this->decodificarLogros($informacion['logros'] ?? null);
            $yaDesbloqueado = in_array('desenterrando_secretos', $logros['desbloqueados'], true);
            if (!$yaDesbloqueado) {
                $logros['desbloqueados'][] = 'desenterrando_secretos';
                $logros['desbloqueados'] = array_values(array_unique($logros['desbloqueados']));
                $jsonLogros = json_encode($logros, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                $stmtGuardar = $this->pdo->prepare(
                    "UPDATE `información` SET `logros` = ? WHERE `id-infor` = ?;"
                );
                $stmtGuardar->execute([$jsonLogros, (int)$informacion['id-infor']]);
            }
            $this->pdo->commit();

            return [
                'logros' => $logros,
                'logros_nuevos' => $yaDesbloqueado ? [] : ['desenterrando_secretos']
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function registrarMicrojuegoTerminado(
        int $idUsuario,
        string $colIdUsuario,
        string $microjuego,
        bool $victoria,
        int $racha
    ): array {
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

        $this->pdo->beginTransaction();
        try {
            $sqlInfo = "
                SELECT i.`id-infor`, i.`puntuación`, i.`logros`
                FROM `usuarios` AS u
                JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
                WHERE u.`{$colIdUsuario}` = ?
                FOR UPDATE;
            ";
            $stmtInfo = $this->pdo->prepare($sqlInfo);
            $stmtInfo->execute([$idUsuario]);
            $informacion = $stmtInfo->fetch();
            if (!$informacion) {
                throw new RuntimeException('No se encontró la cuenta para registrar la partida.');
            }

            $idInfor = (int)$informacion['id-infor'];
            $puntuacion = (int)$informacion['puntuación'];
            if ($victoria && $racha > $puntuacion) {
                $puntuacion = $racha;
                $stmtPuntuacion = $this->pdo->prepare(
                    "UPDATE `información` SET `puntuación` = ? WHERE `id-infor` = ?;"
                );
                $stmtPuntuacion->execute([$puntuacion, $idInfor]);
            }

            $logros = $this->decodificarLogros($informacion['logros'] ?? null);
            $desbloqueadosAntes = $logros['desbloqueados'];
            $jugados = $logros['microjuegos_jugados'];
            if (!in_array($microjuego, $jugados, true)) {
                $jugados[] = $microjuego;
            }
            $logros['microjuegos_jugados'] = $jugados;
            $logros['total_microjuegos'] = (int)$logros['total_microjuegos'] + 1;

            $desbloqueados = $logros['desbloqueados'];
            $total = (int)$logros['total_microjuegos'];
            if ($total >= 3) { $desbloqueados[] = 'primeros_pasos'; }
            if ($total >= 20) { $desbloqueados[] = 'segundos_pasos'; }
            if ($total >= 100) { $desbloqueados[] = 'demasiados_pasos'; }
            if (count($jugados) === count($microjuegos)) { $desbloqueados[] = 'todos_son_mios'; }
            
            $sqlPrimero = "
                SELECT u.`{$colIdUsuario}` AS `id_usuario`
                FROM `usuarios` AS u
                LEFT JOIN `información` AS i ON u.`id-infor` = i.`id-infor`
                ORDER BY COALESCE(i.`puntuación`, 0) DESC, u.`nombre` ASC
                LIMIT 1;
            ";
            $primero = $this->pdo->query($sqlPrimero)->fetch();
            if ($primero && (int)$primero['id_usuario'] === $idUsuario) {
                $desbloqueados[] = 'supremitis_aguda';
            }

            $logros['desbloqueados'] = array_values(array_unique($desbloqueados));
            $jsonLogros = json_encode($logros, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $stmtGuardar = $this->pdo->prepare(
                "UPDATE `información` SET `logros` = ? WHERE `id-infor` = ?;"
            );
            $stmtGuardar->execute([$jsonLogros, $idInfor]);
            $this->pdo->commit();

            return [
                'puntuación' => $puntuacion,
                'logros' => $logros,
                'logros_nuevos' => array_values(array_diff($logros['desbloqueados'], $desbloqueadosAntes))
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function decodificarLogros(?string $json): array {
        $vacio = [
            'desbloqueados' => [],
            'microjuegos_jugados' => [],
            'total_microjuegos' => 0
        ];
        if ($json === null || $json === '') {
            return $vacio;
        }

        try {
            $datos = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException('El JSON de logros de la cuenta no es válido.', 0, $e);
        }
        if (!is_array($datos)) {
            throw new RuntimeException('El JSON de logros debe contener un objeto.');
        }

        return [
            'desbloqueados' => isset($datos['desbloqueados']) && is_array($datos['desbloqueados'])
                ? array_values(array_unique(array_filter($datos['desbloqueados'], 'is_string')))
                : [],
            'microjuegos_jugados' => isset($datos['microjuegos_jugados']) && is_array($datos['microjuegos_jugados'])
                ? array_values(array_unique(array_intersect(
                    ['atraparmariposa', 'duelodemiradas', 'torredesombreros', 'comerlapizza', 'esquivalosproyectiles'],
                    array_filter($datos['microjuegos_jugados'], 'is_string')
                )))
                : [],
            'total_microjuegos' => max(0, (int)($datos['total_microjuegos'] ?? 0))
        ];
    }
}