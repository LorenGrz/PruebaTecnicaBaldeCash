"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clases } from "./clases";
import { IconoDeCarpeta, IconoDeMas, IconoDeResumen } from "./Iconos";

export type ClaveDeIcono = "carpeta" | "resumen" | "mas";

export interface OpcionDeNavegacion {
  href: string;
  texto: string;
  icono: ClaveDeIcono;
}

const ICONOS = {
  carpeta: IconoDeCarpeta,
  resumen: IconoDeResumen,
  mas: IconoDeMas,
} as const;

function estaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegación de la aplicación. Recibe las opciones ya filtradas por rol: el
 * filtro real vive en el layout del servidor, acá solo se pintan.
 */
export function BarraLateral({ opciones }: { opciones: OpcionDeNavegacion[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="border-b border-bc-borde bg-bc-superficie md:w-64 md:shrink-0 md:border-b-0 md:border-r"
    >
      <ul className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-col md:p-4">
        {opciones.map((opcion) => {
          const Icono = ICONOS[opcion.icono];
          const activa = estaActiva(pathname, opcion.href);
          return (
            <li key={opcion.href}>
              <Link
                href={opcion.href}
                aria-current={activa ? "page" : undefined}
                className={clases(
                  "relative flex items-center gap-2.5 whitespace-nowrap rounded-campo px-3 py-2.5 text-sm font-medium",
                  "transition-[background-color,color] duration-[--bc-media]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary",
                  // La marca de sección activa crece desde el borde en vez de
                  // aparecer entera: acompaña el cambio de pantalla.
                  "before:absolute before:rounded-full before:bg-bc-primary before:transition-transform before:duration-[--bc-media]",
                  "before:inset-x-3 before:bottom-0 before:h-0.5 before:origin-left",
                  "md:before:inset-x-auto md:before:inset-y-2 md:before:left-0 md:before:h-auto md:before:w-0.5 md:before:origin-top",
                  activa
                    ? "bg-bc-primary-suave text-bc-primary before:scale-x-100 md:before:scale-y-100"
                    : "text-bc-apagado before:scale-x-0 hover:bg-bc-fondo hover:text-bc-tinta md:before:scale-y-0",
                )}
              >
                <Icono className="h-5 w-5 shrink-0" />
                {opcion.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
