"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Selector } from "@/components/ui/Selector";

const OPCIONES = [
  { valor: "", texto: "Todas" },
  { valor: "pendiente", texto: "Pendiente" },
  { valor: "aprobada", texto: "Aprobada" },
  { valor: "rechazada", texto: "Rechazada" },
];

/**
 * El filtro vive en la URL: sobrevive al refresco, se puede compartir y deja
 * que la página siga siendo un server component.
 */
export function FiltroDeEstado({ estado }: { estado: string }) {
  const router = useRouter();
  const [enTransicion, iniciarTransicion] = useTransition();

  const cambiar = (valor: string) => {
    const parametros = new URLSearchParams();
    if (valor) parametros.set("estado", valor);
    const consulta = parametros.toString();
    iniciarTransicion(() => {
      router.push(consulta ? `/creditos?${consulta}` : "/creditos");
    });
  };

  return (
    <Selector
      id="filtro-estado"
      etiqueta="Estado"
      opciones={OPCIONES}
      value={estado}
      disabled={enTransicion}
      onChange={(evento) => cambiar(evento.target.value)}
      className="sm:w-52"
    />
  );
}
