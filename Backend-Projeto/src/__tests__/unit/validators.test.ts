import { validarSenha } from '../../utils/validators';

describe('validarSenha', () => {
    it('aceita senha com letras e números e pelo menos 6 caracteres', () => {
        expect(validarSenha('leitor123')).toBe(true);
    });

    it('recusa senha sem números', () => {
        expect(validarSenha('somenteletras')).toBe(false);
    });

    it('recusa senha sem letras', () => {
        expect(validarSenha('123456')).toBe(false);
    });

    it('recusa senha com menos de 6 caracteres', () => {
        expect(validarSenha('ab12')).toBe(false);
    });
});
