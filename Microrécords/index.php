<?php
declare(strict_types=1);

if (isset($_GET['accion']) || isset($_POST['accion'])) {
    require __DIR__ . '/Rutas/rutas.php';
    exit;
}

header('Location: Visual/Menú/menú.html', true, 302);
exit;