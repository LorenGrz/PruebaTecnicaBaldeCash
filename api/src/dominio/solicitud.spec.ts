import { ErrorDeConflicto, ErrorDePermiso, ErrorDeValidacion } from './errores.js';
import { Solicitud } from './solicitud.js';
import { Usuario } from './usuario.js';

const TASA = 0.24;

const estudiante = () =>
  Usuario.crear({
    id: 'est-1',
    nombre: 'Clara Fernández',
    dni: '45871203',
    email: 'clara@ejemplo.pe',
    telefono: '987654321',
    rol: 'estudiante',
  });

const admin = () =>
  Usuario.crear({
    id: 'adm-1',
    nombre: 'Emilio Gonzales',
    dni: '10293847',
    email: 'emilio@baldecash.com',
    telefono: '999888777',
    rol: 'admin',
  });

describe('Solicitud.calcularCuota', () => {
  it('reproduce el caso de verificación del enunciado', () => {
    expect(Solicitud.calcularCuota(3000, 12, TASA)).toBe(283.68);
  });

  it.each([
    [1000, 6, 178.53],
    [10000, 6, 1785.26],
    [5000, 18, 333.51],
    [10000, 24, 528.71],
    [1000, 24, 52.87],
  ])('calcula S/ %i a %i meses', (monto, plazo, esperado) => {
    expect(Solicitud.calcularCuota(monto, plazo, TASA)).toBe(esperado);
  });

  it('reparte el capital en partes iguales cuando la tasa es cero', () => {
    // Con i = 0 la fórmula se indetermina (0/0); el caso se resuelve aparte.
    expect(Solicitud.calcularCuota(3000, 12, 0)).toBe(250);
  });

  it('acompaña el cambio de tasa, porque es configurable por entorno', () => {
    expect(Solicitud.calcularCuota(3000, 12, 0.26)).toBe(286.59);
  });

  it('devuelve siempre como mucho dos decimales', () => {
    const cuota = Solicitud.calcularCuota(7777, 18, TASA);
    expect(cuota).toBe(Math.round(cuota * 100) / 100);
  });

  it('cobra más por mes cuanto más corto es el plazo', () => {
    expect(Solicitud.calcularCuota(5000, 6, TASA)).toBeGreaterThan(
      Solicitud.calcularCuota(5000, 24, TASA),
    );
  });

  it('devuelve más intereses en total cuanto más largo es el plazo', () => {
    const total = (plazo: number) => Solicitud.calcularCuota(5000, plazo, TASA) * plazo;
    expect(total(24)).toBeGreaterThan(total(6));
  });
});

describe('Solicitud.validarMonto', () => {
  it.each([1000, 3000, 10000])('acepta S/ %i', (monto) => {
    expect(Solicitud.validarMonto(monto)).toBeNull();
  });

  it.each([999, 10001, 0, -3000])('rechaza S/ %i', (monto) => {
    expect(Solicitud.validarMonto(monto)).toMatch(/entre S\//);
  });

  it('rechaza lo que no es un número', () => {
    expect(Solicitud.validarMonto('3000')).not.toBeNull();
    expect(Solicitud.validarMonto(undefined)).not.toBeNull();
    expect(Solicitud.validarMonto(Number.NaN)).not.toBeNull();
    expect(Solicitud.validarMonto(Number.POSITIVE_INFINITY)).not.toBeNull();
  });
});

describe('Solicitud.validarPlazo', () => {
  it.each([6, 12, 18, 24])('acepta %i meses', (plazo) => {
    expect(Solicitud.validarPlazo(plazo)).toBeNull();
  });

  it.each([1, 9, 36, 0])('rechaza %i meses', (plazo) => {
    expect(Solicitud.validarPlazo(plazo)).toMatch(/6, 12, 18, 24/);
  });
});

describe('Solicitud.crear', () => {
  it('nace pendiente y con la cuota ya calculada', () => {
    const solicitud = Solicitud.crear({
      usuario: estudiante(),
      monto: 3000,
      plazoMeses: 12,
      tasaAnual: TASA,
    });

    expect(solicitud.estado).toBe('pendiente');
    expect(solicitud.cuotaMensual).toBe(283.68);
    expect(solicitud.usuarioId).toBe('est-1');
  });

  it('guarda la tasa con la que fue creada', () => {
    const solicitud = Solicitud.crear({
      usuario: estudiante(),
      monto: 3000,
      plazoMeses: 12,
      tasaAnual: 0.26,
    });

    expect(solicitud.tasaAnual).toBe(0.26);
    expect(solicitud.cuotaMensual).toBe(286.59);
  });

  it('junta todos los campos inválidos en un solo error', () => {
    expect.assertions(2);
    try {
      Solicitud.crear({ usuario: estudiante(), monto: 500, plazoMeses: 7, tasaAnual: TASA });
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeValidacion);
      expect((error as ErrorDeValidacion).detalles.map((d) => d.campo)).toEqual([
        'monto',
        'plazoMeses',
      ]);
    }
  });

  it('no deja que un administrador pida financiamiento para sí mismo', () => {
    expect(() =>
      Solicitud.crear({ usuario: admin(), monto: 3000, plazoMeses: 12, tasaAnual: TASA }),
    ).toThrow(ErrorDePermiso);
  });
});

describe('estados de la solicitud', () => {
  const nueva = () =>
    Solicitud.crear({ usuario: estudiante(), monto: 3000, plazoMeses: 12, tasaAnual: TASA });

  it('el administrador la aprueba', () => {
    const solicitud = nueva();
    solicitud.aprobar(admin());
    expect(solicitud.estado).toBe('aprobada');
  });

  it('el estudiante no puede aprobar la suya', () => {
    expect(() => nueva().aprobar(estudiante())).toThrow(ErrorDePermiso);
  });

  it('no se resuelve dos veces', () => {
    const solicitud = nueva();
    solicitud.rechazar(admin());
    expect(() => solicitud.aprobar(admin())).toThrow(ErrorDeConflicto);
  });

  it('pendiente y aprobada ocupan el cupo del estudiante', () => {
    const solicitud = nueva();
    expect(solicitud.estaActiva()).toBe(true);
    expect(solicitud.permiteReenvio()).toBe(false);

    solicitud.aprobar(admin());
    expect(solicitud.estaActiva()).toBe(true);
  });

  it('rechazada libera el cupo y habilita una nueva', () => {
    const solicitud = nueva();
    solicitud.rechazar(admin());

    expect(solicitud.estaActiva()).toBe(false);
    expect(solicitud.permiteReenvio()).toBe(true);
  });
});

describe('esVisiblePara', () => {
  const nueva = () =>
    Solicitud.crear({ usuario: estudiante(), monto: 3000, plazoMeses: 12, tasaAnual: TASA });

  it('la ve su dueño', () => {
    expect(nueva().esVisiblePara(estudiante())).toBe(true);
  });

  it('la ve el administrador', () => {
    expect(nueva().esVisiblePara(admin())).toBe(true);
  });

  it('no la ve otro estudiante', () => {
    const otro = Usuario.crear({
      id: 'est-2',
      nombre: 'Ethel Castillo',
      dni: '78129034',
      email: 'ethel@ejemplo.pe',
      telefono: '911222333',
      rol: 'estudiante',
    });

    expect(nueva().esVisiblePara(otro)).toBe(false);
  });
});
