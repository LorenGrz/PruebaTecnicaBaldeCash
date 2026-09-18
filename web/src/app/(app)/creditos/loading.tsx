import { Esqueleto, EsqueletoDeEncabezado } from "@/components/ui/Esqueleto";

export default function CargandoCreditos() {
  return (
    <div className="flex flex-col gap-5">
      <EsqueletoDeEncabezado />

      <div className="rounded-tarjeta border border-bc-borde bg-bc-superficie p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Esqueleto className="h-11 w-48" />
          <Esqueleto className="h-4 w-40" />
        </div>
      </div>

      <div className="rounded-tarjeta border border-bc-borde bg-bc-superficie p-4">
        {[0, 1, 2, 3, 4].map((posicion) => (
          <div
            key={posicion}
            className="flex items-center justify-between gap-4 border-b border-bc-borde py-4 last:border-b-0"
          >
            <div className="flex flex-col gap-2">
              <Esqueleto className="h-4 w-36" />
              <Esqueleto className="h-3 w-24" />
            </div>
            <Esqueleto className="hidden h-4 w-24 sm:block" />
            <Esqueleto className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Cargando las solicitudes
      </span>
    </div>
  );
}
