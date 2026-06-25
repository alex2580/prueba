const { query } = require('./connection');

async function main() {
  const result = await query(
    `DELETE FROM conversaciones WHERE purgar_after IS NOT NULL AND purgar_after < CURDATE()`
  );
  console.log(`✅ ${result.affectedRows} conversación(es) purgada(s) (retención vencida)`);
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
