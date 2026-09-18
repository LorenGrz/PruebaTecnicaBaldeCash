"use client";

import { useActionState, useState } from "react";
import { resolverSolicitud } from "@/acciones/solicitudes";
import { ESTADO_INICIAL_DE_RESOLUCION } from "@/acciones/estados";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";

/** Barra de resolución del analista. Solo se renderiza para el rol admin. */
export function AccionesDeSolicitud({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(
    resolverSolicitud,
    ESTADO_INICIAL_DE_RESOLUCION,
  );
  const [ultimaAccion, setUltimaAccion] = useState<"aprobada" | "rechazada" | null>(null);

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}
      <div className="flex flex-wrap gap-3">
        <Boton
          type="submit"
          name="estado"
          value="aprobada"
          variante="aprobar"
          onClick={() => setUltimaAccion("aprobada")}
          cargando={pendiente && ultimaAccion === "aprobada"}
          textoCargando="Aprobando..."
          disabled={pendiente}
        >
          Aprobar
        </Boton>
        <Boton
          type="submit"
          name="estado"
          value="rechazada"
          variante="rechazar"
          onClick={() => setUltimaAccion("rechazada")}
          cargando={pendiente && ultimaAccion === "rechazada"}
          textoCargando="Rechazando..."
          disabled={pendiente}
        >
          Rechazar
        </Boton>
      </div>
    </form>
  );
}
