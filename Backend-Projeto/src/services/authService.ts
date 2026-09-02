import { usuarios } from '../models-auto/usuarios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import { Op } from 'sequelize';
import { HttpError } from '../utils/HttpError';
import { validarSenha } from '../utils/validators';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
}

const EMAIL_REGEX = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

interface CadastroInput {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

interface EditarPerfilInput {
    nome?: string;
    senha?: string;
    cpf?: string;
}

export class AuthService {

    async cadastrar(dados: CadastroInput) {
        const { nome, email, senha, cpf } = dados;

        if (!nome || !email || !senha || !cpf) {
            throw new HttpError(400, 'Todos os campos são obrigatórios');
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        if (!cpfValidator.isValid(cpfLimpo)) {
            throw new HttpError(400, 'CPF inválido');
        }

        if (!validarSenha(senha)) {
            throw new HttpError(400, 'A senha deve conter no mínimo 6 caracteres, incluindo letras e números');
        }

        if (!EMAIL_REGEX.test(email)) {
            throw new HttpError(400, 'Formato de email inválido');
        }

        const emailExiste = await usuarios.findOne({ where: { email } });
        if (emailExiste) {
            throw new HttpError(400, 'Este email já está cadastrado');
        }

        const cpfExiste = await usuarios.findOne({ where: { cpf: cpfLimpo } });
        if (cpfExiste) {
            throw new HttpError(400, 'Este CPF já está cadastrado');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const usuario = await usuarios.create({
            nome,
            email,
            senha: senhaCriptografada,
            cpf: cpfLimpo
        });

        const usuarioSemSenha = usuario.toJSON();
        delete usuarioSemSenha.senha;
        return usuarioSemSenha;
    }

    async login(email: string, senha: string) {
        if (!email || !senha) {
            throw new HttpError(400, 'Email e senha são obrigatórios');
        }

        if (!EMAIL_REGEX.test(email)) {
            throw new HttpError(400, 'Formato de email inválido');
        }

        const usuario = await usuarios.findOne({ where: { email } });
        if (!usuario) {
            throw new HttpError(401, 'Email ou senha inválidos');
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new HttpError(401, 'Email ou senha inválidos');
        }

        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                email: usuario.email,
                nome: usuario.nome,
                tipo_usuario: usuario.tipo_usuario
            },
            JWT_SECRET as string,
            { expiresIn: '5h' }
        );

        const usuarioSemSenha = usuario.toJSON();
        delete usuarioSemSenha.senha;

        return { token, usuario: usuarioSemSenha };
    }

    async buscarPerfil(usuarioId: number) {
        const usuario = await usuarios.findByPk(usuarioId, {
            attributes: { exclude: ['senha'] }
        });
        if (!usuario) {
            throw new HttpError(404, 'Usuário não encontrado');
        }
        return usuario;
    }

    async editarPerfil(usuarioId: number, dados: EditarPerfilInput) {
        const usuario = await usuarios.findByPk(usuarioId);
        if (!usuario) {
            throw new HttpError(404, 'Usuário não encontrado');
        }

        const { nome, senha, cpf } = dados;
        const dadosAtualizados: { nome?: string; senha?: string; cpf?: string } = {};

        if (nome !== undefined) {
            if (!nome || nome.trim().length < 3) {
                throw new HttpError(400, 'Nome deve ter pelo menos 3 caracteres');
            }
            if (nome.trim().length > 100) {
                throw new HttpError(400, 'Nome deve ter no máximo 100 caracteres');
            }
            dadosAtualizados.nome = nome.trim();
        }

        if (cpf !== undefined) {
            const cpfLimpo = cpf.replace(/\D/g, '');

            if (!cpfLimpo || cpfLimpo.length !== 11) {
                throw new HttpError(400, 'CPF deve conter 11 dígitos');
            }
            if (!cpfValidator.isValid(cpfLimpo)) {
                throw new HttpError(400, 'CPF inválido');
            }

            const cpfExiste = await usuarios.findOne({
                where: { cpf: cpfLimpo, id_usuario: { [Op.ne]: usuarioId } }
            });
            if (cpfExiste) {
                throw new HttpError(400, 'Este CPF já está cadastrado');
            }

            dadosAtualizados.cpf = cpfLimpo;
        }

        if (senha !== undefined && senha !== '') {
            if (!validarSenha(senha)) {
                throw new HttpError(400, 'A senha deve conter no mínimo 6 caracteres, incluindo letras e números');
            }
            const salt = await bcrypt.genSalt(10);
            dadosAtualizados.senha = await bcrypt.hash(senha, salt);
        }

        if (Object.keys(dadosAtualizados).length === 0) {
            throw new HttpError(400, 'Nenhum campo válido para atualizar. Campos permitidos: nome, senha, cpf');
        }

        await usuario.update(dadosAtualizados);

        return usuarios.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
    }
}
