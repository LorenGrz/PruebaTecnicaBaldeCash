/** Une clases de Tailwind descartando las vacías o condicionales apagadas. */
export function clases(...valores: Array<string | false | null | undefined>): string {
  return valores.filter(Boolean).join(" ");
}
