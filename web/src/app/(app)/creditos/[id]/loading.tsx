import { Esqueleto, EsqueletoDeTarjeta } from "@/components/ui/Esqueleto";

export default function CargandoDetalleDeCredito() {
  return (
    <div className="flex flex-col gap-5">
      <Esqueleto className="h-4 w-44" />
      <Esqueleto className="h-7 w-64" />
      <EsqueletoDeTarjeta />
      <EsqueletoDeTarjeta />
      <span className="sr-only" role="status">
        Cargando la solicitud
      </span>
    </div>
  );
}
