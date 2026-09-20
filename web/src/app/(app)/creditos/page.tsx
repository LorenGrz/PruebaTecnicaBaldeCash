import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaDeError } from "@/components/TarjetaDeError";
import { FiltroDeEstado } from "@/components/formularios/FiltroDeEstado";
import { Badge } from "@/components/ui/Badge";
import { Revelar } from "@/components/ui/Revelar";
import { TarjetaDeSolicitud } from "@/components/TarjetaDeSolicitud";
import { Celda, Fila, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Solicitud, type EstadoSolicitud } from "@/dominio";
import { comoErrorDeApi } from "@/lib/api";
import { formatearFecha, formatearPlazo, formatearSoles } from "@/lib/formato";
import { listarSolicitudes } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Gestión de créditos | BaldeCash",
};

const POR_PAGINA = 10;
const COLUMNAS = ["Estudiante", "Monto", "Plazo", "Cuota mensual", "Estado", "Fecha", ""];

function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

/** El estado del filtro se valida con el dominio antes de llegar a la API. */
function estadoValido(crudo: string): EstadoSolicitud | undefined {
  if (crudo === "") return undefined;
  return Solicitud.validarEstado(crudo) === null ? (crudo as EstadoSolicitud) : undefined;
}

function enlaceDePagina(estado: string, pagina: number): string {
  const parametros = new URLSearchParams();
  if (estado) parametros.set("estado", estado);
  if (pagina > 1) parametros.set("page", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/creditos?${consulta}` : "/creditos";
}

export default async function PaginaDeCreditos(props: PageProps<"/creditos">) {
  const sesion = await exigirRol("admin");
  const busqueda = await props.searchParams;

  const estadoCrudo = primerValor(busqueda.estado);
  const estado = estadoValido(estadoCrudo);
  const paginaPedida = Number(primerValor(busqueda.page));
  const pagina = Number.isInteger(paginaPedida) && paginaPedida > 0 ? paginaPedida : 1;

  let resultado;
  try {
    resultado = await listarSolicitudes(sesion.id, { estado, page: pagina, limit: POR_PAGINA });
  } catch (error) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl">Solicitudes</h1>
        <TarjetaDeError mensaje={comoErrorDeApi(error).message} />
      </div>
    );
  }

  const { data, total } = resultado;
  const desde = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl">
          Solicitudes{" "}
          <span className="text-bc-apagado font-normal">({total})</span>
        </h1>
        <p className="text-sm text-bc-apagado">
          Revisa las solicitudes de financiamiento y resuélvelas.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <FiltroDeEstado estado={estado ?? ""} />
          <p className="text-sm text-bc-apagado">
            Mostrando {desde}–{hasta} de {total}
          </p>
        </div>
      </Tarjeta>

      {/*
        Dos presentaciones de los mismos datos: tarjetas cuando hay poco ancho,
        tabla cuando entra. La tabla necesita 46rem para leerse, y forzarla en
        menos esconde el estado detrás de un desplazamiento horizontal, que es
        justo el dato por el que se entra a esta pantalla.

        El corte lo decide una consulta de contenedor (`@container` + `@3xl`) y
        no un breakpoint de viewport: la barra lateral se come 16rem, así que a
        1000px de pantalla esta columna tiene menos de 46rem y el viewport
        mentía. El contenedor mide lo que la tabla realmente tiene.
      */}
      {data.length === 0 ? (
        <Tarjeta>
          <p className="py-8 text-center text-sm text-bc-apagado">
            No hay solicitudes con ese estado.
          </p>
        </Tarjeta>
      ) : (
        <div className="@container flex flex-col gap-3">
          <ul key={`${estadoCrudo}-${pagina}`} className="flex flex-col gap-3 @3xl:hidden">
            {data.map((solicitud, posicion) => (
              <Revelar como="li" key={solicitud.id} indice={posicion}>
                <TarjetaDeSolicitud solicitud={solicitud} />
              </Revelar>
            ))}
          </ul>

          <Tarjeta className="hidden p-0 sm:p-0 @3xl:block">
            <Tabla columnas={COLUMNAS}>
              {data.map((solicitud, posicion) => (
                <Fila key={solicitud.id} indice={posicion}>
                <Celda>
                  <span className="block font-semibold">
                    {solicitud.estudiante?.nombre ?? "—"}
                  </span>
                  <span className="block text-xs text-bc-apagado">
                    DNI {solicitud.estudiante?.dni ?? "—"}
                  </span>
                </Celda>
                <Celda className="font-semibold">{formatearSoles(solicitud.monto)}</Celda>
                <Celda>{formatearPlazo(solicitud.plazoMeses)}</Celda>
                <Celda className="font-semibold">
                  {formatearSoles(solicitud.cuotaMensual)}
                </Celda>
                <Celda>
                  <Badge estado={solicitud.estado} />
                </Celda>
                <Celda className="whitespace-nowrap text-bc-apagado">
                  {formatearFecha(solicitud.creadoEn)}
                </Celda>
                <Celda className="text-right">
                  <Link
                    href={`/creditos/${solicitud.id}`}
                    className="rounded-campo font-semibold text-bc-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
                  >
                    Ver
                  </Link>
                </Celda>
                </Fila>
              ))}
            </Tabla>
          </Tarjeta>
        </div>
      )}

      {ultimaPagina > 1 && (
        <nav
          aria-label="Paginación"
          className="flex flex-wrap items-center justify-end gap-3"
        >
          <span className="text-sm text-bc-apagado">
            Página {pagina} de {ultimaPagina}
          </span>
          <EnlaceDePaginacion
            href={enlaceDePagina(estadoCrudo, pagina - 1)}
            habilitado={pagina > 1}
          >
            Anterior
          </EnlaceDePaginacion>
          <EnlaceDePaginacion
            href={enlaceDePagina(estadoCrudo, pagina + 1)}
            habilitado={pagina < ultimaPagina}
          >
            Siguiente
          </EnlaceDePaginacion>
        </nav>
      )}
    </div>
  );
}

function EnlaceDePaginacion({
  href,
  habilitado,
  children,
}: {
  href: string;
  habilitado: boolean;
  children: string;
}) {
  const clases =
    "rounded-campo border border-bc-borde px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary";
  if (!habilitado) {
    return (
      <span aria-disabled="true" className={`${clases} text-bc-apagado/50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={`${clases} text-bc-primary hover:bg-bc-primary-suave`}>
      {children}
    </Link>
  );
}
