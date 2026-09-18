"use client";

import { useActionState, useState } from "react";
import { enviarSolicitud } from "@/acciones/solicitudes";
import { ESTADO_INICIAL_DE_SOLICITUD } from "@/acciones/estados";
import { Solicitud, Usuario } from "@/dominio";
import { TASA_ANUAL_REFERENCIAL } from "@/lib/configuracion";
import { formatearSoles, formatearTasa } from "@/lib/formato";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { SelectorDePlazo } from "./SelectorDePlazo";
import { TarjetaDeExito } from "./TarjetaDeExito";

const PLAZO_POR_DEFECTO = 12;

export interface DatosPrecargados {
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
}

type Tocados = Partial<Record<"nombre" | "email" | "telefono" | "monto", boolean>>;

export function FormularioDeSolicitud({ datos }: { datos: DatosPrecargados }) {
  const [estado, accion, pendiente] = useActionState(
    enviarSolicitud,
    ESTADO_INICIAL_DE_SOLICITUD,
  );

  const [nombre, setNombre] = useState(datos.nombre);
  const [email, setEmail] = useState(datos.email);
  const [telefono, setTelefono] = useState(datos.telefono);
  const [monto, setMonto] = useState("");
  const [plazoMeses, setPlazoMeses] = useState(PLAZO_POR_DEFECTO);
  const [tocados, setTocados] = useState<Tocados>({});

  if (estado.fase === "enviada" && estado.solicitud) {
    return <TarjetaDeExito solicitud={estado.solicitud} />;
  }

  const tocar = (campo: keyof Tocados) =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const montoNumerico = monto === "" ? Number.NaN : Number(monto);
  const errorDeMonto = Solicitud.validarMonto(montoNumerico);

  // Cuota estimada en vivo: misma fórmula que usa la API, sin ida al servidor.
  const cuotaEstimada =
    errorDeMonto === null
      ? Solicitud.calcularCuota(montoNumerico, plazoMeses, TASA_ANUAL_REFERENCIAL)
      : null;

  const errorNombre = tocados.nombre
    ? (Usuario.validarNombre(nombre) ?? undefined)
    : estado.errores.nombre;
  const errorEmail = tocados.email
    ? (Usuario.validarEmail(email) ?? undefined)
    : estado.errores.email;
  const errorTelefono = tocados.telefono
    ? (Usuario.validarTelefono(telefono) ?? undefined)
    : estado.errores.telefono;
  const errorMonto = tocados.monto ? (errorDeMonto ?? undefined) : estado.errores.monto;

  return (
    <form action={accion} className="flex flex-col gap-5" noValidate>
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}

      <Tarjeta titulo="Tus datos">
        <p className="mb-4 text-sm text-bc-apagado">Puedes corregirlos si cambiaron.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="nombre"
            etiqueta="Nombre completo"
            autoComplete="name"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            onBlur={() => tocar("nombre")}
            error={errorNombre}
          />
          <Campo
            id="dni"
            etiqueta="DNI"
            value={datos.dni}
            readOnly
            ayuda="El DNI no se puede cambiar."
            error={estado.errores.dni}
          />
          <Campo
            id="email"
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            onBlur={() => tocar("email")}
            error={errorEmail}
          />
          <Campo
            id="telefono"
            etiqueta="Teléfono"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={9}
            placeholder="9XXXXXXXX"
            value={telefono}
            onChange={(evento) => setTelefono(evento.target.value.replace(/\D/g, "").slice(0, 9))}
            onBlur={() => tocar("telefono")}
            error={errorTelefono}
          />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Tu financiamiento">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="monto"
            etiqueta="Monto"
            prefijo="S/"
            inputMode="numeric"
            placeholder="3000"
            maxLength={6}
            value={monto}
            onChange={(evento) => setMonto(evento.target.value.replace(/\D/g, "").slice(0, 6))}
            onBlur={() => tocar("monto")}
            ayuda="Entre S/ 1,000 y S/ 10,000"
            error={errorMonto}
          />
          <SelectorDePlazo
            valor={plazoMeses}
            onCambio={setPlazoMeses}
            error={estado.errores.plazoMeses}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-campo bg-bc-primary-suave px-4 py-4">
          <p className="text-sm font-semibold text-bc-primary">Cuota mensual estimada</p>
          {/*
            La `key` es el valor: cuando la cuota cambia, React reemplaza el
            nodo y la animación vuelve a correr. Es lo que hace que mover el
            plazo se sienta conectado con el número, en vez de que cambie sin
            aviso mientras el usuario mira el selector.
            `tabular-nums` evita que los dígitos bailen de ancho al recalcular.
          */}
          <p
            key={cuotaEstimada ?? "sin-cuota"}
            className="animate-destacar font-display text-2xl font-extrabold tabular-nums text-bc-primary sm:text-3xl"
          >
            {cuotaEstimada === null ? "—" : formatearSoles(cuotaEstimada)}
          </p>
        </div>
      </Tarjeta>

      <div className="flex flex-col items-start gap-2">
        <Boton type="submit" cargando={pendiente} textoCargando="Enviando...">
          Enviar solicitud
        </Boton>
        <p className="text-xs text-bc-apagado">
          Tasa anual {formatearTasa(TASA_ANUAL_REFERENCIAL)}. La cuota final se confirma al
          enviar la solicitud.
        </p>
      </div>
    </form>
  );
}
