import type { ReactNode, TdHTMLAttributes } from "react";
import { clases } from "./clases";

/**
 * Tabla de datos. Recibe los encabezados como texto para garantizar el
 * `scope="col"` en todas las columnas sin depender de quien la usa.
 */
export function Tabla({
  columnas,
  children,
}: {
  columnas: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-bc-borde">
            {columnas.map((columna) => (
              <th
                key={columna}
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-bc-apagado"
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Fila({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-bc-borde last:border-b-0 hover:bg-bc-fondo">{children}</tr>
  );
}

export function Celda({
  className,
  children,
  ...resto
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...resto} className={clases("px-4 py-3 align-middle text-bc-tinta", className)}>
      {children}
    </td>
  );
}
