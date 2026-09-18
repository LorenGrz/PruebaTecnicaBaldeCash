const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Los ids son uuid de Postgres. Un id con otra forma no existe en la base, y
 * preguntarlo igual haría fallar la consulta con un error de tipo (22P02) que
 * terminaría en un 500. Se descarta antes de llegar al driver.
 */
export function esUuid(valor: string): boolean {
  return FORMATO_UUID.test(valor);
}
