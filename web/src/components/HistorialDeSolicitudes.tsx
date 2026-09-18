"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Revelar } from "@/components/ui/Revelar";
import { Dato, Tarjeta } from "@/components/ui/Tarjeta";
import {
  formatearFecha,
  formatearPlazo,
  formatearSoles,
  referenciaCorta,
} from "@/lib/formato";
import type { SolicitudDTO } from "@/lib/tipos";

/**
 * Historial de solicitudes del estudiante, paginado en el navegador.
 *
 * La API devuelve el historial completo porque una persona junta unas pocas
 * solicitudes en toda su vida con el producto: paginar en el servidor costaría
 * un viaje por página para ordenar, en el mejor de los casos, seis filas. Acá
 * el cambio de página es instantáneo y no toca la red.
 */
const POR_PAGINA = 5;

interface Props {
  solicitudes: SolicitudDTO[];
}

export function HistorialDeSolicitudes({ solicitudes }: Props) {
  const [pagina, setPagina] = useState(1);

  const paginas = Math.max(1, Math.ceil(solicitudes.length / POR_PAGINA));
  // Si el historial se acorta entre renders, la página actual podría quedar
  // fuera de rango: se recorta al vuelo en vez de guardarla en un efecto.
  const actual = Math.min(pagina, paginas);
  const desde = (actual - 1) * POR_PAGINA;
  const visibles = solicitudes.slice(desde, desde + POR_PAGINA);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Historial de solicitudes</h2>
        <p className="text-sm text-bc-apagado">
          {solicitudes.length === 1
            ? "1 solicitud"
            : `${solicitudes.length} solicitudes`}
        </p>
      </div>

      {/*
        La `key` incluye la página: al cambiar de página React reemplaza la
        lista entera y la entrada escalonada vuelve a correr. Sin eso, cambiar
        de página sustituye el texto en silencio y cuesta notar que algo pasó.
      */}
      <ul key={actual} className="flex flex-col gap-3">
        {visibles.map((solicitud, posicion) => (
          <Revelar como="li" key={solicitud.id} indice={posicion}>
            <Tarjeta
              className="hover:border-bc-primary/40 hover:shadow-[0_2px_12px_rgba(70,84,205,0.08)]"
              titulo={`Solicitud #${referenciaCorta(solicitud.id)}`}
              accion={<Badge estado={solicitud.estado} />}
            >
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Dato etiqueta="Monto">
                  <span className="tabular-nums">{formatearSoles(solicitud.monto)}</span>
                </Dato>
                <Dato etiqueta="Plazo">{formatearPlazo(solicitud.plazoMeses)}</Dato>
                <Dato etiqueta="Cuota mensual">
                  <span className="tabular-nums">{formatearSoles(solicitud.cuotaMensual)}</span>
                </Dato>
                <Dato etiqueta="Enviada el">{formatearFecha(solicitud.creadoEn)}</Dato>
              </dl>
              <Link
                href={`/resumen/${solicitud.id}`}
                className="mt-5 inline-block rounded-campo text-sm font-semibold text-bc-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
              >
                Ver detalle de la solicitud →
              </Link>
            </Tarjeta>
          </Revelar>
        ))}
      </ul>

      {paginas > 1 && (
        <nav
          aria-label="Paginación del historial"
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-bc-apagado">
            Mostrando {desde + 1}–{desde + visibles.length} de {solicitudes.length}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <BotonDePagina
              onClick={() => setPagina(actual - 1)}
              deshabilitado={actual === 1}
            >
              « Anterior
            </BotonDePagina>
            {Array.from({ length: paginas }, (_, indice) => indice + 1).map((numero) => (
              <BotonDePagina
                key={numero}
                onClick={() => setPagina(numero)}
                activo={numero === actual}
                aria-current={numero === actual ? "page" : undefined}
              >
                {numero}
              </BotonDePagina>
            ))}
            <BotonDePagina
              onClick={() => setPagina(actual + 1)}
              deshabilitado={actual === paginas}
            >
              Siguiente »
            </BotonDePagina>
          </div>
        </nav>
      )}
    </section>
  );
}

interface PropsDeBoton extends React.ComponentPropsWithoutRef<"button"> {
  deshabilitado?: boolean;
  activo?: boolean;
}

function BotonDePagina({ deshabilitado, activo, className, ...props }: PropsDeBoton) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      className={[
        "rounded-campo px-3 py-1.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary",
        activo
          ? "bg-bc-primary text-white"
          : "text-bc-apagado hover:bg-bc-primary-suave hover:text-bc-primary",
        deshabilitado ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}
