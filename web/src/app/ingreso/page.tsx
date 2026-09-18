import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Marca } from "@/components/Marca";
import { FormularioDeIngreso } from "@/components/formularios/FormularioDeIngreso";
import { INICIO_POR_ROL, leerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Ingresa a tu cuenta | BaldeCash",
};

export default async function PaginaDeIngreso() {
  const sesion = await leerSesion();
  if (sesion) redirect(INICIO_POR_ROL[sesion.rol]);

  return (
    <main className="flex flex-1 items-center justify-center bg-bc-fondo px-4 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <Marca alto={40} />
        <div className="w-full rounded-tarjeta border border-bc-borde bg-bc-superficie p-6 sm:p-8">
          <FormularioDeIngreso />
        </div>
        <p className="text-center text-xs text-bc-apagado">
          Financiamiento de laptops para estudiantes universitarios.
        </p>
      </div>
    </main>
  );
}
