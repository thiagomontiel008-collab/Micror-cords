-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 12-11-2026 a las 03:11:07
-- Versión del servidor: 8.4.7
-- Versión de PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `microrécords`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `información`
--

DROP TABLE IF EXISTS `información`;
CREATE TABLE IF NOT EXISTS `información` (
  `id-infor` int NOT NULL AUTO_INCREMENT,
  `logros` json DEFAULT NULL,
  `puntuación` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id-infor`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `información`
--

INSERT INTO `información` (`id-infor`, `logros`, `puntuación`) VALUES
(10, '{\"desbloqueados\": [\"desenterrando_secretos\"], \"total_microjuegos\": 0, \"microjuegos_jugados\": []}', 0),
(11, '{\"desbloqueados\": [\"desenterrando_secretos\", \"supremitis_aguda\", \"primeros_pasos\", \"todos_son_mios\", \"segundos_pasos\"], \"total_microjuegos\": 24, \"microjuegos_jugados\": [\"atraparmariposa\", \"duelodemiradas\", \"torredesombreros\", \"comerlapizza\", \"esquivalosproyectiles\"]}', 5),
(12, '{\"desbloqueados\": [\"desenterrando_secretos\"], \"total_microjuegos\": 0, \"microjuegos_jugados\": []}', 0),
(13, '{\"desbloqueados\": [\"desenterrando_secretos\"], \"total_microjuegos\": 0, \"microjuegos_jugados\": []}', 0),
(14, '{\"desbloqueados\": [\"desenterrando_secretos\"], \"total_microjuegos\": 0, \"microjuegos_jugados\": []}', 0),
(15, '{\"desbloqueados\": [\"supremitis_aguda\", \"primeros_pasos\", \"todos_son_mios\", \"desenterrando_secretos\"], \"total_microjuegos\": 13, \"microjuegos_jugados\": [\"atraparmariposa\", \"duelodemiradas\", \"torredesombreros\", \"comerlapizza\", \"esquivalosproyectiles\"]}', 4),
(16, NULL, 0),
(17, '{\"desbloqueados\": [\"primeros_pasos\", \"supremitis_aguda\"], \"total_microjuegos\": 8, \"microjuegos_jugados\": [\"atraparmariposa\", \"duelodemiradas\", \"torredesombreros\", \"esquivalosproyectiles\"]}', 6),
(18, '{\"desbloqueados\": [\"primeros_pasos\", \"todos_son_mios\", \"desenterrando_secretos\"], \"total_microjuegos\": 9, \"microjuegos_jugados\": [\"atraparmariposa\", \"duelodemiradas\", \"torredesombreros\", \"comerlapizza\", \"esquivalosproyectiles\"]}', 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contraseña` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id-infor` int NOT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `contraseña`, `id-infor`) VALUES
(16, 'Carlos', '$2y$10$2Ym5qRoun47aCuDDacpoAeklmtJoDDOSPclKB4aVennEQ5bMP.DCW', 16),
(17, 'Kirby', '$2y$10$PY5ryH7.yGZuXpWvm4pmhOjRVU51utjdj.1xP/asPg.1w4nR0/lNW', 17),
(15, 'pepe', '$2y$10$9lDjyX0G214ZANj6QFBknuRKhFJ36l3lwDDqJ.jC1qFQN8KLTXumi', 15),
(18, 'Gustavo', '$2y$10$aXdVxR.oIKKHSJBe1ZbTFewdmhHvCKFX.J9F5chODCd0J1QdJBjsa', 18);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
