import { test, expect, type Page } from '@playwright/test';

const leituraBase = {
    id_leitura: 9001,
    id_usuario: 1,
    id_livro: 101,
    status: 'lendo',
    data_inicio: '2026-06-01',
    pagina_atual: 120,
    vezes_lido: 1,
    livro: {
        id_livro: 101,
        titulo: 'Leitura E2E',
        autor: 'Autor E2E',
        genero: 'Fantasia',
        num_paginas: 320,
        capa: null,
    },
    tags: [],
};

const tagsResponse = {
    total: 0,
    pagina: 1,
    totalPaginas: 1,
    tags: [],
};

const anotacoesResponse = {
    pagina: 1,
    total: 0,
    anotacoes: [],
};

async function autenticarPagina(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('token', 'token-fake-e2e');
        localStorage.setItem(
            'usuario',
            JSON.stringify({ id: 1, id_usuario: 1, nome: 'Usuaria E2E', email: 'e2e@teste.com' })
        );
    });
}

async function mockBaseLeituras(page: Page, status = 200) {
    await page.route('**/api/leituras/listar**', async (route) => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: status === 200
                ? JSON.stringify({ total: 1, pagina: 1, totalPaginas: 1, leituras: [leituraBase] })
                : JSON.stringify({ message: 'Falha ao carregar leituras' }),
        });
    });

    await page.route('**/api/tags**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(tagsResponse),
        });
    });

    await page.route('**/api/anotacoes/leitura/*/pagina/*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(anotacoesResponse),
        });
    });
}

async function abrirModalLeitura(page: Page) {
    await page.locator('.book-card').first().click();
    await expect(page.locator('.modal-content-large')).toBeVisible();
    await expect(page.locator('.modal-content-large h2')).toHaveText('Leitura E2E');
}

test.describe('CRUD Leituras', () => {
    test.beforeEach(async ({ page }) => {
        await autenticarPagina(page);
    });

    test('listar sucesso - exibe leituras em andamento', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.goto('/leitura');

        await expect(page.getByRole('heading', { name: 'Minhas Leituras' })).toBeVisible();
        await expect(page.getByText('1 livro(s) em leitura')).toBeVisible();
        await expect(page.locator('h3.book-title', { hasText: 'Leitura E2E' })).toBeVisible();
    });

    test('listar falha - mostra estado vazio quando a API falha', async ({ page }) => {
        await mockBaseLeituras(page, 500);

        await page.goto('/leitura');

        await expect(page.getByRole('heading', { name: 'Minhas Leituras' })).toBeVisible();
        await expect(page.getByText('Nenhum livro em leitura. Comece uma nova leitura na biblioteca!')).toBeVisible();
    });

    test('atualizar progresso sucesso - fecha modal após salvar', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Progresso atualizado com sucesso', leitura: leituraBase }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Atualizar Progresso' }).click();
        await expect(page.locator('.modal-content-large')).toHaveCount(0);
    });

    test('atualizar progresso falha - modal continua aberto', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ erro: 'Falha ao atualizar progresso' }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Atualizar Progresso' }).click();
        await expect(page.locator('.modal-content-large')).toBeVisible();
        await expect(page.locator('.modal-content-large h2')).toHaveText('Leitura E2E');
    });

    test('marcar como lido e avaliar sucesso - conclui fluxo', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Status alterado para lido', leitura: leituraBase }),
            });
        });

        await page.route('**/api/leituras/9001/avaliar', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Livro avaliado com sucesso', leitura: leituraBase }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Marcar como Lido' }).click();
        await page.getByRole('button', { name: 'Sim, marcar como lido' }).click();
        await page.getByRole('button', { name: '5 ⭐' }).click();
        await page.locator('.modal-content-large textarea').fill('Ótima leitura');
        await page.getByRole('button', { name: 'Salvar Avaliação' }).click();

        await expect(page.locator('.modal-content-large')).toHaveCount(0);
    });

    test('marcar como lido falha - modal continua aberto', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ erro: 'Falha ao marcar como lido' }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Marcar como Lido' }).click();
        await page.getByRole('button', { name: 'Sim, marcar como lido' }).click();

        await expect(page.locator('.modal-content-large')).toBeVisible();
    });

    test('abandonar sucesso - fecha modal após confirmar', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Leitura abandonada', leitura: leituraBase }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Abandonar' }).click();
        await page.getByRole('button', { name: 'Confirmar Abandono' }).click();

        await expect(page.locator('.modal-content-large')).toHaveCount(0);
    });

    test('abandonar falha - modal continua aberto', async ({ page }) => {
        await mockBaseLeituras(page, 200);

        await page.route('**/api/leituras/9001/progresso', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ erro: 'Falha ao abandonar leitura' }),
            });
        });

        await page.goto('/leitura');
        await abrirModalLeitura(page);

        await page.getByRole('button', { name: 'Abandonar' }).click();
        await page.getByRole('button', { name: 'Confirmar Abandono' }).click();

        await expect(page.locator('.modal-content-large')).toBeVisible();
    });
});
