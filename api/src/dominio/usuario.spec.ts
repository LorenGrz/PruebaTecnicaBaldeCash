import { ErrorDeValidacion } from './errores.js';
import { Usuario } from './usuario.js';

const datosValidos = {
  nombre: 'Clara Fernández',
  dni: '45871203',
  email: 'clara@ejemplo.pe',
  telefono: '987654321',
  direccion: 'Av. Arequipa 1234, Lima',
};

describe('Usuario.validarDni', () => {
  it('acepta exactamente 8 dígitos', () => {
    expect(Usuario.validarDni('45871203')).toBeNull();
  });

  it.each(['1234567', '123456789', '4587120a', 'abcdefgh', '', '  '])(
    'rechaza "%s"',
    (dni) => {
      expect(Usuario.validarDni(dni)).not.toBeNull();
    },
  );
});

describe('Usuario.validarTelefono', () => {
  it('acepta 9 dígitos que empiezan en 9', () => {
    expect(Usuario.validarTelefono('987654321')).toBeNull();
  });

  it.each(['887654321', '98765432', '9876543210', '9 8765432'])(
    'rechaza "%s"',
    (telefono) => {
      expect(Usuario.validarTelefono(telefono)).toMatch(/9 dígitos/);
    },
  );

  it('pide el teléfono cuando viene vacío', () => {
    expect(Usuario.validarTelefono('')).toMatch(/obligatorio/);
  });
});

describe('Usuario.validarDireccion', () => {
  it('acepta una dirección de 5 a 200 caracteres', () => {
    expect(Usuario.validarDireccion('Av. Arequipa 1234, Lima')).toBeNull();
    expect(Usuario.validarDireccion('a'.repeat(200))).toBeNull();
  });

  it.each([undefined, null, '', '   '])('la pide cuando viene %p', (direccion) => {
    expect(Usuario.validarDireccion(direccion)).toMatch(/obligatoria/);
  });

  it('rechaza menos de 5 caracteres, sin contar los espacios', () => {
    expect(Usuario.validarDireccion('  Av.  ')).toMatch(/al menos 5/);
  });

  it('rechaza más de 200 caracteres', () => {
    expect(Usuario.validarDireccion('a'.repeat(201))).toMatch(/200/);
  });
});

describe('Usuario.validarEmail', () => {
  it.each(['clara@ejemplo.pe', 'a.b+c@sub.dominio.com'])(
    'acepta "%s"',
    (email) => {
      expect(Usuario.validarEmail(email)).toBeNull();
    },
  );

  it.each([
    'clara',
    'clara@',
    '@ejemplo.pe',
    'clara@ejemplo',
    'clara @ejemplo.pe',
  ])('rechaza "%s"', (email) => {
    expect(Usuario.validarEmail(email)).not.toBeNull();
  });
});

describe('Usuario.crear', () => {
  it('normaliza espacios y mayúsculas del correo', () => {
    const usuario = Usuario.crear({
      ...datosValidos,
      nombre: '  Clara Fernández  ',
      email: '  Clara@Ejemplo.PE ',
    });

    expect(usuario.nombre).toBe('Clara Fernández');
    expect(usuario.email).toBe('clara@ejemplo.pe');
  });

  it('es estudiante si no se indica otro rol', () => {
    const usuario = Usuario.crear(datosValidos);
    expect(usuario.esEstudiante()).toBe(true);
    expect(usuario.puedeGestionarSolicitudes()).toBe(false);
  });

  it('el estudiante ve sus propias solicitudes y no las ajenas', () => {
    const usuario = Usuario.crear({ ...datosValidos, id: 'est-1' });

    expect(usuario.puedeVerSolicitudesDe('est-1')).toBe(true);
    expect(usuario.puedeVerSolicitudesDe('est-2')).toBe(false);
  });

  it('el administrador ve las solicitudes de cualquiera', () => {
    const admin = Usuario.crear({ ...datosValidos, id: 'adm-1', rol: 'admin' });

    expect(admin.puedeVerSolicitudesDe('est-1')).toBe(true);
    expect(admin.puedeVerSolicitudesDe('adm-1')).toBe(true);
  });

  it('el administrador gestiona pero no solicita', () => {
    const usuario = Usuario.crear({ ...datosValidos, rol: 'admin' });
    expect(usuario.puedeGestionarSolicitudes()).toBe(true);
    expect(usuario.puedeSolicitarFinanciamiento()).toBe(false);
  });

  it('informa todos los campos inválidos de una vez', () => {
    expect.assertions(2);
    try {
      Usuario.crear({
        nombre: 'A',
        dni: '123',
        email: 'nope',
        telefono: '123',
        direccion: '',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeValidacion);
      expect((error as ErrorDeValidacion).detalles.map((d) => d.campo)).toEqual(
        ['nombre', 'dni', 'email', 'telefono', 'direccion'],
      );
    }
  });
});

describe('actualizarDatosDeContacto', () => {
  it('cambia el contacto y deja el DNI intacto', () => {
    const usuario = Usuario.crear(datosValidos);

    usuario.actualizarDatosDeContacto({
      nombre: 'Clara F. Ramírez',
      email: 'nueva@ejemplo.pe',
      telefono: '911222333',
      direccion: ' Jr. Junín 456, Cusco ',
    });

    expect(usuario.nombre).toBe('Clara F. Ramírez');
    expect(usuario.direccion).toBe('Jr. Junín 456, Cusco');
    expect(usuario.email).toBe('nueva@ejemplo.pe');
    expect(usuario.dni).toBe('45871203');
  });

  it('rechaza un contacto inválido sin dejar el objeto a medias', () => {
    const usuario = Usuario.crear(datosValidos);

    expect(() =>
      usuario.actualizarDatosDeContacto({
        nombre: 'Clara F. Ramírez',
        email: 'roto',
        telefono: '911222333',
        direccion: 'Jr. Junín 456, Cusco',
      }),
    ).toThrow(ErrorDeValidacion);

    expect(usuario.nombre).toBe('Clara Fernández');
    expect(usuario.email).toBe('clara@ejemplo.pe');
    expect(usuario.direccion).toBe('Av. Arequipa 1234, Lima');
  });
});

describe('Usuario.desdePersistencia', () => {
  it('lee una fila anterior a la dirección sin revalidarla', () => {
    const usuario = Usuario.desdePersistencia({
      ...datosValidos,
      id: 'est-1',
      rol: 'estudiante',
      direccion: null,
    });

    expect(usuario.direccion).toBeNull();
  });
});
