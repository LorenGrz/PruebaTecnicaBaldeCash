import { leerTasaAnual } from './configuracion.js';

describe('leerTasaAnual', () => {
  it('usa 24% cuando la variable no está definida', () => {
    expect(leerTasaAnual(undefined)).toBe(0.24);
    expect(leerTasaAnual('')).toBe(0.24);
  });

  it('lee la tasa del entorno', () => {
    expect(leerTasaAnual('0.26')).toBe(0.26);
    expect(leerTasaAnual('0')).toBe(0);
  });

  it.each(['veinticuatro', '24', '1', '-0.1'])(
    'no deja arrancar con "%s"',
    (valor) => {
      expect(() => leerTasaAnual(valor)).toThrow(/TASA_ANUAL/);
    },
  );
});
