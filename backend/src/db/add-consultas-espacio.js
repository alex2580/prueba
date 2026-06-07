require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('./connection');

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS consultas_espacio (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      espacio_id   VARCHAR(36)  NOT NULL,
      autor_id     VARCHAR(36)  NOT NULL,
      autor_nombre VARCHAR(120) NOT NULL,
      pregunta     TEXT         NOT NULL,
      respuesta    TEXT         NULL,
      respuesta_at DATETIME     NULL,
      created_at   DATETIME     DEFAULT NOW(),
      INDEX idx_espacio (espacio_id),
      FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
    )
  `);

  // Columnas que pueden faltar si la tabla fue creada con una versión anterior
  await query(`ALTER TABLE consultas_espacio ADD COLUMN IF NOT EXISTS respuesta    TEXT     NULL`).catch(() => {});
  await query(`ALTER TABLE consultas_espacio ADD COLUMN IF NOT EXISTS respuesta_at DATETIME NULL`).catch(() => {});

  console.log('✅ consultas_espacio OK');
}

migrate()
  .then(() => { console.log('Done.'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
