"use client";

import { useActionState, useState } from "react";
import { ingresarOAlta } from "@/acciones/sesion";
import { ESTADO_INICIAL_DE_INGRESO } from "@/acciones/estados";
import { Usuario } from "@/dominio";
import { DNI_INVALIDO } from "@/lib/mensajes";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";

type Tocados = Partial<Record<"dni" | "nombre" | "email" | "telefono", boolean>>;

/**
 * Tarjeta de ingreso. Es la misma en sus dos fases: pedir el DNI y, cuando la
 * API responde 404, expandirse para crear la cuenta del estudiante.
 */
export function FormularioDeIngreso() {
  const [estado, accion, pendiente] = useActionState(
    ingresarOAlta,
    ESTADO_INICIAL_DE_INGRESO,
  );

  const [modo, setModo] = useState<"ingreso" | "alta">("ingreso");
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tocados, setTocados] = useState<Tocados>({});

  // Sincroniza el modo con la última respuesta del servidor sin useEffect
  // (patrón de "ajustar estado durante el render" de React).
  const [respuestaVista, setRespuestaVista] = useState(estado);
  if (estado !== respuestaVista) {
    setRespuestaVista(estado);
    setModo(estado.modo);
  }

  const soloDigitos = (valor: string, largo: number) =>
    valor.replace(/\D/g, "").slice(0, largo);

  const tocar = (campo: keyof Tocados) => setTocados((previos) => ({ ...previos, [campo]: true }));

  // Los errores que llegaron del servidor solo valen para la fase que los produjo.
  const delServidor = modo === estado.modo ? estado.errores : {};
  const mensajeGeneral = modo === estado.modo ? estado.mensaje : null;

  const errorDni =
    tocados.dni && Usuario.validarDni(dni) !== null ? DNI_INVALIDO : delServidor.dni;
  const errorNombre = tocados.nombre
    ? (Usuario.validarNombre(nombre) ?? undefined)
    : delServidor.nombre;
  const errorEmail = tocados.email
    ? (Usuario.validarEmail(email) ?? undefined)
    : delServidor.email;
  const errorTelefono = tocados.telefono
    ? (Usuario.validarTelefono(telefono) ?? undefined)
    : delServidor.telefono;

  const volverAlDni = () => {
    setModo("ingreso");
    setDni("");
    setTocados({});
  };

  return (
    <form action={accion} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="modo" value={modo} />

      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl">Ingresa a tu cuenta</h1>
        <p className="text-sm text-bc-apagado">Usa tu DNI para continuar</p>
      </div>

      {modo === "alta" && (
        <Aviso>
          No encontramos ese DNI. Completa tus datos para crear tu cuenta.
        </Aviso>
      )}

      {mensajeGeneral && <Aviso tono="error">{mensajeGeneral}</Aviso>}

      <Campo
        id="dni"
        etiqueta="DNI"
        inputMode="numeric"
        autoComplete="off"
        placeholder="12345678"
        maxLength={8}
        value={dni}
        readOnly={modo === "alta"}
        onChange={(evento) => setDni(soloDigitos(evento.target.value, 8))}
        onBlur={() => tocar("dni")}
        error={errorDni}
        ayuda={modo === "alta" ? "Este es el DNI que ingresaste." : undefined}
      />

      {modo === "alta" && (
        <>
          <Campo
            id="nombre"
            etiqueta="Nombre completo"
            autoComplete="name"
            placeholder="María Fernanda Quispe"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            onBlur={() => tocar("nombre")}
            error={errorNombre}
          />
          <Campo
            id="email"
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="maria@universidad.edu.pe"
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
            placeholder="9XXXXXXXX"
            maxLength={9}
            value={telefono}
            onChange={(evento) => setTelefono(soloDigitos(evento.target.value, 9))}
            onBlur={() => tocar("telefono")}
            error={errorTelefono}
          />
        </>
      )}

      <Boton
        type="submit"
        anchoCompleto
        cargando={pendiente}
        textoCargando={modo === "alta" ? "Creando cuenta..." : "Verificando..."}
      >
        {modo === "alta" ? "Crear cuenta y continuar" : "Continuar"}
      </Boton>

      {modo === "alta" && (
        <button
          type="button"
          onClick={volverAlDni}
          className="text-sm font-semibold text-bc-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary rounded-campo"
        >
          Usar otro DNI
        </button>
      )}
    </form>
  );
}
