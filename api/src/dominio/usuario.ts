import { ErrorDeValidacion, type DetalleDeError } from './errores.js';

export type RolUsuario = 'estudiante' | 'admin';

export interface DatosDeUsuario {
  id?: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  rol?: RolUsuario;
  creadoEn?: Date;
}

/**
 * Un usuario de la plataforma: el estudiante que pide financiamiento o el
 * analista que lo resuelve.
 *
 * Clase de dominio pura: no conoce Nest, React ni la base de datos, así que
 * corre igual en la API y en el frontend. Cada validación devuelve el mensaje
 * de error o `null`, para que el formulario pueda pedirlas campo por campo;
 * `crear` las junta todas y lanza.
 */
export class Usuario {
  readonly id?: string;
  nombre: string;
  readonly dni: string;
  email: string;
  telefono: string;
  readonly rol: RolUsuario;
  readonly creadoEn?: Date;

  private constructor(
    datos: Required<
      Pick<DatosDeUsuario, 'nombre' | 'dni' | 'email' | 'telefono'>
    > &
      DatosDeUsuario,
  ) {
    this.id = datos.id;
    this.nombre = datos.nombre.trim();
    this.dni = datos.dni.trim();
    this.email = datos.email.trim().toLowerCase();
    this.telefono = datos.telefono.trim();
    this.rol = datos.rol ?? 'estudiante';
    this.creadoEn = datos.creadoEn;
  }

  static validarNombre(nombre: unknown): string | null {
    if (typeof nombre !== 'string' || nombre.trim().length === 0) {
      return 'El nombre es obligatorio';
    }
    if (nombre.trim().length < 3)
      return 'El nombre debe tener al menos 3 caracteres';
    if (nombre.trim().length > 120)
      return 'El nombre no puede superar los 120 caracteres';
    return null;
  }

  static validarDni(dni: unknown): string | null {
    if (typeof dni !== 'string' || dni.trim().length === 0)
      return 'El DNI es obligatorio';
    if (!/^\d{8}$/.test(dni.trim()))
      return 'El DNI debe tener exactamente 8 dígitos numéricos';
    return null;
  }

  static validarEmail(email: unknown): string | null {
    if (typeof email !== 'string' || email.trim().length === 0) {
      return 'El correo es obligatorio';
    }
    // Suficiente para un formulario: un local, una arroba, un dominio con punto.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return 'El correo no tiene un formato válido';
    }
    if (email.trim().length > 160)
      return 'El correo no puede superar los 160 caracteres';
    return null;
  }

  static validarTelefono(telefono: unknown): string | null {
    if (typeof telefono !== 'string' || telefono.trim().length === 0) {
      return 'El teléfono es obligatorio';
    }
    if (!/^9\d{8}$/.test(telefono.trim())) {
      return 'El teléfono debe tener 9 dígitos y empezar en 9';
    }
    return null;
  }

  /** Valida todos los campos juntos y construye el usuario, o lanza con el detalle. */
  static crear(datos: DatosDeUsuario): Usuario {
    const detalles: DetalleDeError[] = [];
    const revisar = (campo: string, mensaje: string | null) => {
      if (mensaje) detalles.push({ campo, mensaje });
    };

    revisar('nombre', Usuario.validarNombre(datos.nombre));
    revisar('dni', Usuario.validarDni(datos.dni));
    revisar('email', Usuario.validarEmail(datos.email));
    revisar('telefono', Usuario.validarTelefono(datos.telefono));

    if (detalles.length > 0) {
      throw new ErrorDeValidacion(
        'Los datos del usuario son inválidos',
        detalles,
      );
    }

    return new Usuario(
      datos as DatosDeUsuario &
        Required<Pick<DatosDeUsuario, 'nombre' | 'dni' | 'email' | 'telefono'>>,
    );
  }

  /**
   * Reconstruye un usuario ya guardado. No revalida: los datos entraron por
   * `crear`, y una regla que se endurezca mañana no debe romper la lectura de
   * las filas de ayer.
   */
  static desdePersistencia(
    datos: Required<Pick<DatosDeUsuario, 'id' | 'rol'>> & DatosDeUsuario,
  ): Usuario {
    return new Usuario(datos);
  }

  esAdmin(): boolean {
    return this.rol === 'admin';
  }

  esEstudiante(): boolean {
    return this.rol === 'estudiante';
  }

  /** Solo el analista de créditos lista y resuelve solicitudes ajenas. */
  puedeGestionarSolicitudes(): boolean {
    return this.esAdmin();
  }

  /**
   * Quién puede ver las solicitudes de un estudiante: él mismo, siempre, y el
   * analista de créditos, que las revisa todas.
   *
   * Es la única definición de la regla en el proyecto: la usan el historial y
   * el detalle de una solicitud. Un estudiante no necesita permiso especial
   * para mirar lo suyo; lo necesita para mirar lo ajeno.
   */
  puedeVerSolicitudesDe(usuarioId: string): boolean {
    return this.esAdmin() || this.id === usuarioId;
  }

  /** Solo el estudiante pide financiamiento para sí mismo. */
  puedeSolicitarFinanciamiento(): boolean {
    return this.esEstudiante();
  }

  /**
   * Actualiza los datos de contacto. El DNI no se toca: identifica a la persona
   * y es la clave con la que ingresa.
   */
  actualizarDatosDeContacto(datos: {
    nombre: string;
    email: string;
    telefono: string;
  }): void {
    const detalles: DetalleDeError[] = [];
    const revisar = (campo: string, mensaje: string | null) => {
      if (mensaje) detalles.push({ campo, mensaje });
    };

    revisar('nombre', Usuario.validarNombre(datos.nombre));
    revisar('email', Usuario.validarEmail(datos.email));
    revisar('telefono', Usuario.validarTelefono(datos.telefono));

    if (detalles.length > 0) {
      throw new ErrorDeValidacion(
        'Los datos de contacto son inválidos',
        detalles,
      );
    }

    this.nombre = datos.nombre.trim();
    this.email = datos.email.trim().toLowerCase();
    this.telefono = datos.telefono.trim();
  }
}
