#!/usr/bin/env node
/**
 * Verifica que `web/src/dominio` siga siendo una copia fiel de
 * `api/src/dominio`.
 *
 * La duplicación es deliberada: no hay workspace, los dos proyectos son
 * independientes y aun así tienen que compartir una única definición de "qué
 * es una solicitud válida" y de cómo se calcula la cuota. El precio es que
 * pueden desincronizarse, y este script es el que no lo permite.
 *
 * ÚNICA diferencia tolerada: la API corre en Node con ESM y sus imports
 * relativos llevan extensión `.js`; el bundler del frontend (Turbopack) no
 * resuelve esa extensión, así que en la copia web va sin ella. La comparación
 * normaliza exactamente eso y nada más.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DOMINIO_WEB = join(AQUI, "..", "dominio");
const DOMINIO_API = join(AQUI, "..", "..", "..", "api", "src", "dominio");

const esFuente = (archivo) => archivo.endsWith(".ts") && !archivo.endsWith(".spec.ts");

/** Quita la extensión `.js` de los imports relativos. */
const normalizar = (contenido) =>
  contenido.replace(/(from\s+['"]\.\/[^'"]+?)\.js(['"])/g, "$1$2");

const listar = (carpeta) => readdirSync(carpeta).filter(esFuente).sort();

const problemas = [];
const enApi = listar(DOMINIO_API);
const enWeb = listar(DOMINIO_WEB);

for (const archivo of enApi) {
  if (!enWeb.includes(archivo)) {
    problemas.push(`Falta en web/src/dominio: ${archivo}`);
    continue;
  }

  const lineasApi = normalizar(readFileSync(join(DOMINIO_API, archivo), "utf8")).split("\n");
  const lineasWeb = normalizar(readFileSync(join(DOMINIO_WEB, archivo), "utf8")).split("\n");

  const total = Math.max(lineasApi.length, lineasWeb.length);
  for (let i = 0; i < total; i += 1) {
    if (lineasApi[i] !== lineasWeb[i]) {
      problemas.push(
        `${archivo}:${i + 1}\n  api: ${lineasApi[i] ?? "(sin línea)"}\n  web: ${lineasWeb[i] ?? "(sin línea)"}`,
      );
      break;
    }
  }
}

for (const archivo of enWeb) {
  if (!enApi.includes(archivo)) problemas.push(`Sobra en web/src/dominio: ${archivo}`);
}

if (problemas.length > 0) {
  console.error("El dominio del frontend se desincronizó del de la API:\n");
  for (const problema of problemas) console.error(`  - ${problema}`);
  console.error("\nCopia de nuevo api/src/dominio a web/src/dominio.");
  process.exit(1);
}

console.log(`Dominio sincronizado con la API (${enApi.length} archivos).`);
