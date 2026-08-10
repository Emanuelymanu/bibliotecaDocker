import { test, expect, type Page } from '@playwright/test';

const fixturePath = 'ProjetoFrontend/public/vite.svg';

const livroBase = {
    id_livro: 101,
    titulo: 'Livro E2E',
    subtitulo: '',
    autor: 'Autor E2E',
    tipo_obra: 'unico',
    nome_serie: '',
    ano_publicacao: 2024,
    num_paginas: 320,
    genero: 'Fantasia',
    editora: 'Editora E2E',
    capa: null,
    leituras: [
        {
            id_leitura: 5001,
            status: 'quero_ler',
            pagina_atual: 0,
            avaliacao: 0,
        },
    ],
};

async function autenticarLocalStorage(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('token', 'token-fake-e2e');
        localStorage.setItem(
            'usuario',
            JSON.stringify({ id: 1, id_usuario: 1, nome: 'Usuaria E2E', email: 'e2e@teste.com' })
        );
    });
}

async function preencherFormularioCadastro(page: Page) {
    const form = page.locator('form.form-cadastro');

    await form.locator('input[type="file"]').setInputFiles(fixturePath);
    await form.locator('input[type="text"]').nth(0).fill('Livro Novo E2E');
    await form.locator('input[type="text"]').nth(2).fill('Autor Novo E2E');
    await form.locator('div.input-group').filter({ hasText: 'Tipo de Obra' }).locator('select').selectOption('unico');
    await form.locator('div.input-group').filter({ hasText: 'Número de Páginas' }).locator('input').fill('250');
    await form.locator('input[type="text"]').nth(4).fill('Drama');
    await form.locator('input[type="text"]').nth(5).fill('Editora Teste');
}

async function abrirModalLivroNaBiblioteca(page: Page) {
    await page.locator('.book-card').first().click();
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();
}

test.describe('CRUD Livro', () => {
    test.beforeEach(async ({ page }) => {
        await autenticarLocalStorage(page);
    });

    test('create sucesso - cadastra livro com capa', async ({ page }) => {
        await page.route('**/api/livros/cadastrar', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Livro adicionado à sua estante com sucesso!', livro: livroBase }),
            });
        });

        await page.goto('/CadastroLivro');
        await preencherFormularioCadastro(page);
        await page.getByRole('button', { name: 'Salvar Livro' }).click();

        await expect(page.getByRole('heading', { name: 'Livro cadastrado com sucesso!' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page).toHaveURL(/\/biblioteca/i);
    });

    test('create falha - retorna erro da API', async ({ page }) => {
        await page.route('**/api/livros/cadastrar', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Erro interno ao cadastrar livro' }),
            });
        });

        await page.goto('/CadastroLivro');
        await preencherFormularioCadastro(page);
        await page.getByRole('button', { name: 'Salvar Livro' }).click();

        await expect(page.getByRole('heading', { name: 'Erro Interno' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page).toHaveURL(/\/cadastrolivro/i);
    });

    test('read sucesso - lista livros na biblioteca', async ({ page }) => {
        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ livros: [livroBase] }),
            });
        });

        await page.goto('/biblioteca');
        await expect(page.getByRole('heading', { name: 'Biblioteca' })).toBeVisible();
        await expect(page.getByText('Livro E2E')).toBeVisible();
    });

    test('read falha - mostra lista vazia e alerta', async ({ page }) => {
        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Falha ao listar livros' }),
            });
        });

        await page.goto('/biblioteca');
        await expect(page.getByRole('heading', { name: 'Erro Interno' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByText('Nenhum livro encontrado.')).toBeVisible();
    });

    test('update sucesso - edita livro existente', async ({ page }) => {
        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ livros: [livroBase] }),
            });
        });

        await page.route('**/api/livros/editar/*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    livro: {
                        ...livroBase,
                        titulo: 'Livro E2E Atualizado',
                    },
                }),
            });
        });

        await page.goto('/biblioteca');
        await abrirModalLivroNaBiblioteca(page);
        await page.getByRole('button', { name: 'Editar' }).click();
        await expect(page).toHaveURL(/\/editarlivro/i);

        const form = page.locator('form.form-cadastro');
        await form.locator('input[type="text"]').nth(0).fill('Livro E2E Atualizado');
        await page.getByRole('button', { name: 'Salvar Alterações' }).click();

        await expect(page.getByRole('heading', { name: 'Livro atualizado com sucesso!' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page).toHaveURL(/\/biblioteca/i);
    });

    test('update falha - erro ao atualizar livro', async ({ page }) => {
        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ livros: [livroBase] }),
            });
        });

        await page.route('**/api/livros/editar/*', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Falha ao atualizar livro' }),
            });
        });

        await page.goto('/biblioteca');
        await abrirModalLivroNaBiblioteca(page);
        await page.getByRole('button', { name: 'Editar' }).click();
        await expect(page).toHaveURL(/\/editarlivro/i);

        await page.getByRole('button', { name: 'Salvar Alterações' }).click();
        await expect(page.getByRole('heading', { name: 'Erro Interno' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
    });

    test('delete sucesso - exclui livro da biblioteca', async ({ page }) => {
        let deletado = false;

        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ livros: deletado ? [] : [livroBase] }),
            });
        });

        await page.route('**/api/livros/deletar/*', async (route) => {
            deletado = true;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Livro excluído com sucesso' }),
            });
        });

        await page.goto('/biblioteca');
        await abrirModalLivroNaBiblioteca(page);
        await page.getByRole('button', { name: 'Excluir' }).click();
        await page.getByRole('button', { name: 'Sim, excluir' }).click();

        await expect(page.getByText('Livro excluído com sucesso!')).toBeVisible();
        await expect(page.getByText('Nenhum livro encontrado.')).toBeVisible();
    });

    test('delete falha - erro interno da API', async ({ page }) => {
        await page.route('**/api/livros', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ livros: [livroBase] }),
            });
        });

        await page.route('**/api/livros/deletar/*', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Falha ao excluir livro' }),
            });
        });

        await page.goto('/biblioteca');
        await abrirModalLivroNaBiblioteca(page);
        await page.getByRole('button', { name: 'Excluir' }).click();
        await page.getByRole('button', { name: 'Sim, excluir' }).click();

        await expect(page.getByRole('heading', { name: 'Erro Interno' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.locator('h3.book-title', { hasText: 'Livro E2E' })).toBeVisible();
    });
});
