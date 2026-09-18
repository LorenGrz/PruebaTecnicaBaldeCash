import { ErrorDeValidacion } from './errores.js';
import { Usuario } from './usuario.js';

const datosValidos = {
  nombre: 'Clara Fernández',
  dni: '45871203',
  email: 'clara@ejemplo.pe',
  telefono: '987654321',
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
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeValidacion);
      expect((error as ErrorDeValidacion).detalles.map((d) => d.campo)).toEqual(
        ['nombre', 'dni', 'email', 'telefono'],
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
    });

    expect(usuario.nombre).toBe('Clara F. Ramírez');
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
      }),
    ).toThrow(ErrorDeValidacion);

    expect(usuario.nombre).toBe('Clara Fernández');
    expect(usuario.email).toBe('clara@ejemplo.pe');
  });
});
