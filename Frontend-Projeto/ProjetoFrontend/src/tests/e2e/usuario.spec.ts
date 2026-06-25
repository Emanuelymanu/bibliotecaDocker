import { test, expect, type Page } from '@playwright/test';

test.describe('Criação de usuário', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/cadastro');
    });

    test('sucesso - dados válidos', async ({ page }: { page: Page }) => {
        await page.route('**/api/auth/cadastro', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ mensagem: 'Cadastro realizado com sucesso' })
            });
        });

        await page.fill('#nome', 'Novo Usuário');
        await page.fill('#email', `joao${Date.now()}@teste.com`);
        await page.fill('#cpf', '52998224725');
        await page.fill('#senha', 'senha123');
        await page.fill('#confirmarSenha', 'senha123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/login');
    });

    test('falha - email já existe', async ({ page }: { page: Page }) => {
        await page.route('**/api/auth/cadastro', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Email já cadastrado' })
            });
        });

        await page.fill('#nome', 'Usuário Existente');
        await page.fill('#email', 'usuario@teste.com');
        await page.fill('#cpf', '52998224725');
        await page.fill('#senha', 'senha123');
        await page.fill('#confirmarSenha', 'senha123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/cadastro');
        await expect(page.getByRole('heading', { name: 'Dados Inválidos' })).toBeVisible();
        await expect(page.getByText('Email já cadastrado')).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
    });
});