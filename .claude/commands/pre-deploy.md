# Pre-deploy checklist — TodasMisCosas

Ejecutá estos pasos en orden antes de hacer push a master.

## 1. TypeScript
Corré `cd frontend && npx tsc --noEmit` y reportá:
- Si hay errores: mostralos y detené el proceso
- Si está limpio: confirmalo con ✅

## 2. Archivos modificados
Corré `git status` y `git diff --stat HEAD` y mostrá:
- Qué archivos cambiaron
- Cuántas líneas agregadas / eliminadas
- Si hay archivos sin stagear (unstaged)

## 3. Novedades
Revisá si `docs/novedades.md` fue modificado en esta sesión.
- Si NO fue modificado: avisame con ⚠️ y preguntame si quiero documentar los cambios antes de pushear
- Si SÍ fue modificado: confirmalo con ✅

## 4. Commits pendientes
Corré `git log origin/master..HEAD --oneline` y mostrá los commits que están listos para pushear.
Si no hay commits nuevos, avisame.

## 5. Resumen final
Mostrá un resumen así:
- TypeScript: ✅ / ❌
- Archivos modificados: X archivos
- Novedades documentadas: ✅ / ⚠️
- Commits para pushear: X commits

Si todo está ✅ decime "Listo para pushear 🚀"
Si hay algo ⚠️ o ❌ esperá mi confirmación antes de hacer push.
