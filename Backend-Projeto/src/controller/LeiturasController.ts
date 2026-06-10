import { Request, Response } from 'express';
import { leituras } from '../models-auto/leituras';
import { livros } from '../models-auto/livros';
import { StatusLeitura, CriarLeituraDTO, LeituraResponse, ListarLeiturasQuery } from '../types/leituraTypes';
import { Op } from 'sequelize';
import { anotacoes } from '../models-auto/anotacoes';

// Interface estendida para aceitar dados vindos do front baseados na API do Google
interface CriarLeituraGoogleDTO extends CriarLeituraDTO {
   id_google?: string;
   titulo?: string;
   autor?: string;
   num_paginas?: number;
   capa?: string;
}

export class LeiturasController {
   async iniciarLeitura(req: Request<{}, {}, CriarLeituraGoogleDTO>, res: Response): Promise<Response> {
      try {
         if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
         }

         const { id_livro, id_google, titulo, autor, num_paginas, capa } = req.body;
         let livroIdFinal = id_livro;

         // ALTERAÇÃO: Se o livro veio direto da busca da API e não tem ID local ainda,
         // nós garantimos a criação ou localização dele usando findOrCreate.
         if (!livroIdFinal && id_google) {
            const [livroLocal] = await livros.findOrCreate({
               where: { id_google },
               defaults: {
                  id_google,
                  titulo: titulo || 'Título Desconhecido',
                  autor: autor || 'Autor Desconhecido',
                  num_paginas: num_paginas ? Number(num_paginas) : null,
                  capa: capa || null
               }
            });
            livroIdFinal = livroLocal.id_livro;
         }

         if (!livroIdFinal) {
            return res.status(400).json({ erro: 'ID do livro ou ID do Google é obrigatório' });
         }

         // Ajustamos a requisição para prosseguir com o ID do livro local definido
         req.body.id_livro = livroIdFinal;

         const valid = await this.validarIniciarLeitura(req, res, num_paginas);
         if (valid) return valid;

         const leitura = await this.criarLeituraNoBanco(req);
         const resposta = await this.montarRespostaLeitura(leitura.id_leitura);

         return res.status(201).json({
            mensagem: 'Leitura iniciada com sucesso!', leitura: resposta
         });
      } catch (error) {
         console.error('Erro ao iniciar leitura:', error);
         return res.status(500).json({ erro: 'Erro interno ao iniciar leitura' });
      }
   }

   // Mudança na assinatura para receber o num_paginas opcional da requisição externa
   private async validarIniciarLeitura(req: Request<{}, {}, CriarLeituraGoogleDTO>, res: Response, numPaginasExterno?: number) {
      const { id_livro, status, pagina_atual } = req.body;
      const paginaAtualNum = pagina_atual !== undefined ? Number(pagina_atual) : undefined;
      const usuarioId = req.usuario!.id || req.usuario!.id_usuario;

      const livro = await livros.findByPk(id_livro);
      if (!livro) {
         return res.status(404).json({ erro: 'Livro não encontrado no banco local' });
      }

      const leituraExiste = await leituras.findOne({ where: { id_usuario: usuarioId, id_livro: id_livro } });
      if (leituraExiste) {
         return res.status(400).json({ erro: 'Você já possui uma leitura para este livro' });
      }

      const statusValidos: StatusLeitura[] = ['nao_lido', 'quero_ler', 'lendo', 'lido', 'abandonado', 'relendo'];
      if (status && !statusValidos.includes(status)) {
         return res.status(400).json({ erro: 'status inválido' });
      }

      // Validação dinâmica do limite de páginas: Prioriza o banco, se estiver nulo, usa o enviado pela API
      const numPaginasMax = livro.num_paginas ? Number(livro.num_paginas) : (numPaginasExterno ? Number(numPaginasExterno) : null);
      
      if (numPaginasMax && paginaAtualNum !== undefined && (paginaAtualNum < 0 || paginaAtualNum > numPaginasMax)) {
         return res.status(400).json({
            erro: `Página atual deve estar entre 0 e ${numPaginasMax}`
         });
      }
      return null;
   }

   private async criarLeituraNoBanco(req: Request<{}, {}, CriarLeituraGoogleDTO>) {
      const { id_livro, status, pagina_atual } = req.body;
      const paginaAtualNum = pagina_atual !== undefined ? Number(pagina_atual) : undefined;
      const usuarioId = req.usuario!.id || req.usuario!.id_usuario;

      return await leituras.create({
         id_usuario: usuarioId,
         id_livro: id_livro!,
         status: status || 'nao_lido',
         pagina_atual: paginaAtualNum !== undefined ? paginaAtualNum : 0,
         vezes_lido: status === 'lido' ? 1 : 0,
         data_inicio: new Date().toISOString().split('T')[0]
      });
   }

   private async montarRespostaLeitura(id_leitura: number): Promise<LeituraResponse> {
      const leituraCompleta = await leituras.findByPk(id_leitura, {
         include: [{
            model: livros,
            as: 'id_livro_livro'
         }]
      });

      return {
         id_leitura: leituraCompleta!.id_leitura,
         id_usuario: leituraCompleta!.id_usuario,
         id_livro: leituraCompleta!.id_livro,
         status: leituraCompleta!.status,
         data_inicio: leituraCompleta!.data_inicio,
         data_conclusao: leituraCompleta!.data_conclusao,
         avaliacao: leituraCompleta!.avaliacao,
         resenha: leituraCompleta!.resenha,
         pagina_atual: leituraCompleta!.pagina_atual,
         vezes_lido: leituraCompleta!.vezes_lido,
         livro: leituraCompleta!.id_livro_livro ? {
            id_livro: leituraCompleta!.id_livro_livro.id_livro,
            titulo: leituraCompleta!.id_livro_livro.titulo,
            autor: leituraCompleta!.id_livro_livro.autor,
            num_paginas: leituraCompleta!.id_livro_livro.num_paginas,
            capa: leituraCompleta!.id_livro_livro.capa
         } : undefined
      };
   }

   async buscarLeitura(req: Request, res: Response): Promise<Response> {
      try {
         const usuarioId = req.usuario!.id || req.usuario!.id_usuario;
         const id = Number(req.params.id);

         if (isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
         }

         const leitura = await leituras.findOne({
            where: { id_leitura: id, id_usuario: usuarioId },
            include: [
               { model: livros, as: 'id_livro_livro' },
               { model: anotacoes, as: 'anotacos' }
            ]
         });

         if (!leitura) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
         }

         return res.json(leitura);
      } catch (error) {
         console.error('Erro ao buscar leitura:', error);
         return res.status(500).json({ erro: 'Erro interno ao buscar leitura' });
      }
   }

   async listarLeituras(req: Request<{}, {}, {}, ListarLeiturasQuery>, res: Response): Promise<Response> {
      try {
         if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
         }

         const usuarioId = req.usuario.id || req.usuario.id_usuario;
         const { status, page = 1, limit = 10 } = req.query;

         const pagina = Number(page);
         const limite = Number(limit);

         if (isNaN(pagina) || pagina < 1) {
            return res.status(400).json({ erro: 'Página inválida' });
         }
         if (isNaN(limite) || limite < 1 || limite > 100) {
            return res.status(400).json({ erro: 'Limite inválido (máximo 100)' });
         }

         const offset = (pagina - 1) * limite;
         const where: any = { id_usuario: usuarioId };

         if (status) {
            where.status = status;
         }

         const { count, rows } = await leituras.findAndCountAll({
            where,
            limit: limite,
            offset,
            order: [['data_inicio', 'DESC']],
            include: [{ model: livros, as: 'id_livro_livro' }]
         });

         const leiturasResponse: LeituraResponse[] = rows.map(leitura => ({
            id_leitura: leitura.id_leitura,
            id_usuario: leitura.id_usuario,
            id_livro: leitura.id_livro,
            status: leitura.status,
            data_inicio: leitura.data_inicio,
            data_conclusao: leitura.data_conclusao,
            avaliacao: leitura.avaliacao,
            resenha: leitura.resenha,
            pagina_atual: leitura.pagina_atual,
            vezes_lido: leitura.vezes_lido,
            livro: leitura.id_livro_livro ? {
               id_livro: leitura.id_livro_livro.id_livro,
               titulo: leitura.id_livro_livro.titulo,
               autor: leitura.id_livro_livro.autor,
               num_paginas: leitura.id_livro_livro.num_paginas,
               capa: leitura.id_livro_livro.capa
            } : undefined
         }));

         return res.json({
            total: count,
            pagina,
            totalPaginas: Math.ceil(count / limite),
            leituras: leiturasResponse
         });
      } catch (error) {
         console.error('Erro ao listar leituras:', error);
         return res.status(500).json({ erro: 'Erro interno ao listar leituras' });
      }
   }

   async deletarLeitura(req: Request, res: Response): Promise<Response> {
      try {
         if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
         }
         const usuarioId = req.usuario.id || req.usuario.id_usuario;
         const id = Number(req.params.id);

         if (isNaN(id)) {
            return res.status(400).json({ erro: 'Id inválido' });
         }

         const leitura = await leituras.findOne({
            where: { id_leitura: id, id_usuario: usuarioId }
         });

         if (!leitura) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
         }

         await leitura.destroy();
         return res.json({ mensagem: 'Leitura deletada com sucesso' });
      } catch (error) {
         console.error('Erro ao deletar leitura:', error);
         return res.status(500).json({ erro: 'Erro interno ao deletar leitura' });
      }
   }
}