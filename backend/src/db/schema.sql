-- ============================================================
--  TodasMisCosas.com — Schema MySQL v1.0
--  Marketplace de almacenamiento urbano - Buenos Aires
-- ============================================================

USE u713501758_todasmiscosas;

-- ─────────────────────────────────────────────────────────────
--  USUARIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  supabase_id   VARCHAR(36)   UNIQUE,
  nombre        VARCHAR(120)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  tel           VARCHAR(30),
  tipo          ENUM('oferente','demandante','admin') NOT NULL DEFAULT 'demandante',
  avatar_url    VARCHAR(500),
  verificado    BOOLEAN       NOT NULL DEFAULT FALSE,
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  ESPACIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS espacios (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  nombre        VARCHAR(200)  NOT NULL,
  direccion     VARCHAR(300)  NOT NULL,
  barrio        VARCHAR(100)  NOT NULL,
  m2            DECIMAL(8,2)  NOT NULL,
  tipo          ENUM('exclusivo','compartido') NOT NULL DEFAULT 'exclusivo',
  precio_dia    DECIMAL(10,2) NOT NULL,
  precio_mes    DECIMAL(10,2) NOT NULL,
  descripcion   TEXT,
  oferente_id   VARCHAR(36)   NOT NULL,
  lat           DECIMAL(10,7) NOT NULL,
  lng           DECIMAL(10,7) NOT NULL,
  disponible    BOOLEAN       NOT NULL DEFAULT TRUE,
  rating        DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  reviews_count INT           NOT NULL DEFAULT 0,
  reservas_mes  INT           NOT NULL DEFAULT 0,
  badge         VARCHAR(100),
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (oferente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_barrio (barrio),
  INDEX idx_tipo (tipo),
  INDEX idx_disponible (disponible),
  INDEX idx_oferente (oferente_id),
  INDEX idx_rating (rating DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  FOTOS ESPACIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS espacio_fotos (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  espacio_id    VARCHAR(36)   NOT NULL,
  url           VARCHAR(500)  NOT NULL,
  orden         INT           NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE,
  INDEX idx_espacio (espacio_id, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  RESERVAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  espacio_id    VARCHAR(36)   NOT NULL,
  usuario_id    VARCHAR(36)   NOT NULL,
  fecha_desde   DATE          NOT NULL,
  fecha_hasta   DATE          NOT NULL,
  precio_total  DECIMAL(10,2) NOT NULL,
  estado        ENUM('pendiente','confirmada','pagada','cancelada','finalizada') NOT NULL DEFAULT 'pendiente',
  mp_preference_id  VARCHAR(200),
  mp_payment_id     VARCHAR(200),
  mp_status         VARCHAR(50),
  notas         TEXT,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (espacio_id)  REFERENCES espacios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_espacio   (espacio_id),
  INDEX idx_usuario   (usuario_id),
  INDEX idx_estado    (estado),
  INDEX idx_fechas    (fecha_desde, fecha_hasta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  REVIEWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  espacio_id    VARCHAR(36)   NOT NULL,
  autor_id      VARCHAR(36)   NOT NULL,
  rating        TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  texto         TEXT          NOT NULL,
  util_count    INT           NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_espacio (espacio_id),
  INDEX idx_autor   (autor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  CONVERSACIONES (CHAT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversaciones (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  espacio_id    VARCHAR(36)   NOT NULL,
  demandante_id VARCHAR(36)   NOT NULL,
  oferente_id   VARCHAR(36)   NOT NULL,
  ultimo_msg    TEXT,
  ultimo_msg_at DATETIME,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (espacio_id)    REFERENCES espacios(id) ON DELETE CASCADE,
  FOREIGN KEY (demandante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (oferente_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conv (espacio_id, demandante_id),
  INDEX idx_demandante (demandante_id),
  INDEX idx_oferente   (oferente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  MENSAJES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  conversacion_id VARCHAR(36)   NOT NULL,
  autor_id        VARCHAR(36)   NOT NULL,
  texto           TEXT          NOT NULL,
  leido           BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id)        REFERENCES usuarios(id)       ON DELETE CASCADE,
  INDEX idx_conv  (conversacion_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  SERVICIOS ADICIONALES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios_adicionales (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  reserva_id    VARCHAR(36)   NOT NULL,
  tipo          ENUM('seguro','embalaje','transporte','limpieza') NOT NULL,
  precio        DECIMAL(10,2) NOT NULL,
  estado        ENUM('activo','cancelado') NOT NULL DEFAULT 'activo',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
--  SEED DATA — Usuarios demo
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO usuarios (id, supabase_id, nombre, email, tel, tipo, verificado) VALUES
  ('u1', NULL, 'Carlos Méndez',       'carlos@todasmiscosas.com',    '+54 11 4523-8871', 'oferente',   TRUE),
  ('u2', NULL, 'Marta Rodríguez',     'marta@todasmiscosas.com',     '+54 11 6778-4490', 'oferente',   TRUE),
  ('u3', NULL, 'Ana García',          'ana@gmail.com',               '+54 11 1562-3344', 'demandante', FALSE),
  ('u4', NULL, 'Pablo Torres',        'pablo@empresa.com',           '+54 11 1578-9900', 'demandante', FALSE),
  ('u5', NULL, 'Admin TMC',           'admin@todasmiscosas.com',     '',                 'admin',      TRUE),
  ('u6', NULL, 'Guillermo Domínguez', 'guilleadominguez@gmail.com',  '+54 11 0000-0001', 'admin',      TRUE),
  ('u7', NULL, 'Alejandro Laporte',   'alejandro.laporte@gmail.com', '+54 11 0000-0002', 'admin',      TRUE),
  ('u8', NULL, 'Lucía Fernández',     'lucia.fernandez@gmail.com',   '+54 11 2211-5566', 'oferente',   TRUE),
  ('u9', NULL, 'Martín Sosa',         'martin.sosa@gmail.com',       '+54 11 3344-7788', 'demandante', FALSE);

-- ─────────────────────────────────────────────────────────────
--  SEED DATA — Espacios demo
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO espacios (id, nombre, direccion, barrio, m2, tipo, precio_dia, precio_mes, descripcion, oferente_id, lat, lng, disponible, rating, reviews_count, reservas_mes, badge) VALUES
  ('e1', 'Cochera Palermo',        'Thames 1842, Palermo, CABA',          'Palermo',      18,  'exclusivo',  850,   18000, 'Cochera techada, acceso 24hs, cámara de seguridad. Portón eléctrico.',             'u1', -34.5885, -58.4278, TRUE,  4.9, 38, 12, '⭐ Más reservado'),
  ('e2', 'Depósito Logístico N.',  'Av. Libertador 4500, Vte. López',     'Vicente López',120, 'compartido', 2200,  45000, 'Galpón industrial con estanterías metálicas. Acceso para camiones.',               'u1', -34.5159, -58.4788, TRUE,  4.7, 21, 6,  '🏭 Industrial'),
  ('e3', 'Baulera Belgrano',       'Sucre 2100, Belgrano, CABA',          'Belgrano',     6,   'exclusivo',  350,   6500,  'Baulera en edificio con vigilancia. 3er piso, ascensor.',                           'u1', -34.5571, -58.4534, TRUE,  4.8, 54, 9,  '💎 Súper anfitrión'),
  ('e4', 'Sala Recoleta',          'Av. Santa Fe 3200, Recoleta, CABA',   'Recoleta',     25,  'compartido', 1100,  22000, 'Espacio multiuso con seguridad 24hs y cámaras.',                                    'u1', -34.5883, -58.3964, TRUE,  4.6, 17, 4,  NULL),
  ('e5', 'Mini Storage V. Crespo', 'Corrientes 5100, Villa Crespo, CABA', 'Villa Crespo', 10,  'exclusivo',  480,   9500,  'Módulos individuales con cerradura propia. Planta baja.',                           'u2', -34.6018, -58.4428, FALSE, 4.5, 8,  0,  NULL),
  ('e6', 'Depósito San Isidro',    'Av. Libertador 16200, San Isidro',    'San Isidro',   80,  'compartido', 1800,  38000, 'Galpón en zona exclusiva norte. Vigilancia privada.',                               'u1', -34.4734, -58.5273, TRUE,  4.8, 29, 8,  '✅ Verificado'),
  ('e7', 'Box Caballito',          'Av. Rivadavia 5400, Caballito, CABA', 'Caballito',    12,  'exclusivo',  620,   13000, 'Box privado planta baja con rampa de acceso. Ideal motos y bicicletas.',            'u2', -34.6183, -58.4367, TRUE,  4.7, 33, 7,  '🔒 Exclusivo premium'),
  ('e8', 'Galpón Quilmes',         'Av. Calchaquí 1200, Quilmes',         'Quilmes',      200, 'compartido', 3200,  68000, 'Gran galpón industrial. Ideal empresas logísticas y e-commerce.',                  'u1', -34.7219, -58.2557, TRUE,  4.9, 45, 15, '🚚 Top Logística');

-- ─────────────────────────────────────────────────────────────
--  SEED DATA — Reviews demo
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO reviews (id, espacio_id, autor_id, rating, texto, util_count) VALUES
  ('r1', 'e1', 'u3', 5, 'Excelente cochera, muy limpia y segura. Carlos me respondió al toque para coordinar el acceso. 100% recomendable.', 12),
  ('r2', 'e1', 'u4', 5, 'Todo perfecto. La cochera es amplia, bien iluminada y el portón eléctrico funciona muy bien. Ya la volví a reservar.', 8),
  ('r3', 'e1', 'u3', 4, 'Muy buena experiencia. Cámara de seguridad funcionando, acceso 24hs como prometido. Le saco una estrella porque el portón tarda un poco.', 5),
  ('r6', 'e3', 'u3', 5, 'Baulera enorme para el tamaño. Cabe mucho más de lo que parece. Edificio con vigilancia 24hs. Volveré a usarla.', 7),
  ('r7', 'e3', 'u4', 5, 'Perfecta para guardar cajas de mudanza. Carlos es súper prolijo y puntual. La recomendaría sin dudarlo.', 4),
  ('r9', 'e6', 'u4', 5, 'Excelente galpón. Acceso perfecto para camiones de hasta 9 metros. Vigilancia privada real, muy prolijos.', 11),
  ('r10','e6', 'u3', 5, 'Lo usamos para stock de temporada alta. Espacio limpio, seco, con estanterías. Muy recomendable para e-commerce.', 9);
