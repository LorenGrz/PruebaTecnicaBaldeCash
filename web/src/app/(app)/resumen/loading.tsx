import { EsqueletoDeEncabezado, EsqueletoDeTarjeta } from "@/components/ui/Esqueleto";

/**
 * Next muestra esto mientras la pantalla espera a la API. Sin él, el navegador
 * se queda con la pantalla anterior y la navegación parece trabada.
 */
export default function CargandoResumen() {
  return (
    <div className="flex flex-col gap-5">
      <EsqueletoDeEncabezado />
      <div className="flex flex-col gap-3">
        <EsqueletoDeTarjeta />
        <EsqueletoDeTarjeta />
      </div>
      <span className="sr-only" role="status">
        Cargando tus solicitudes
      </span>
    </div>
  );
}
