"use client";

import { useActionState, useState } from "react";
import { resolverSolicitud } from "@/acciones/solicitudes";
import {
  ESTADO_INICIAL_DE_RESOLUCION,
  type EstadoDeResolucion,
} from "@/acciones/estados";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { DialogoDeConfirmacion } from "@/components/ui/DialogoDeConfirmacion";

/** Barra de resolución del analista. Solo se renderiza para el rol admin. */
export function AccionesDeSolicitud({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(
    resolverSolicitud,
    ESTADO_INICIAL_DE_RESOLUCION,
  );
  const [ultimaAccion, setUltimaAccion] = useState<"aprobada" | "rechazada" | null>(null);

  // El diálogo queda atado a la respuesta que estaba vigente al abrirlo. Cuando
  // la acción devuelve una nueva (un error), deja de coincidir y se cierra solo,
  // sin un efecto que sincronice dos estados. Si sale bien, la página se
  // revalida, la solicitud ya no está pendiente y este componente se desmonta.
  const [abiertoCon, setAbiertoCon] = useState<EstadoDeResolucion | null>(null);
  const confirmando = abiertoCon === estado;

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
        {/* Rechazar no envía: abre la confirmación, porque una solicitud rechazada no vuelve atrás. */}
        <Boton
          type="button"
          variante="rechazar"
          onClick={() => {
            setUltimaAccion("rechazada");
            setAbiertoCon(estado);
          }}
          disabled={pendiente}
        >
          Rechazar
        </Boton>
      </div>
      <DialogoDeConfirmacion
        abierto={confirmando}
        titulo="¿Rechazar esta solicitud?"
        textoConfirmar="Sí, rechazar"
        textoCargando="Rechazando..."
        varianteConfirmar="rechazar"
        cargando={pendiente && ultimaAccion === "rechazada"}
        onCancelar={() => setAbiertoCon(null)}
        nombre="estado"
        valor="rechazada"
      >
        El estudiante verá la solicitud como rechazada y esta decisión no se puede deshacer.
      </DialogoDeConfirmacion>
    </form>
  );
}
