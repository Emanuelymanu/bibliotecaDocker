import { test, expect, type Page } from '@playwright/test';

test.describe('Login', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await page.goto('/login');
    });

    test('sucesso - credenciais corretas', async ({ page }: { page: Page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'token-fake-e2e',
                    usuario: { id: 1, nome: 'Usuario Teste', email: 'usuario@teste.com' }
                })
            });
        });

        await page.fill('#email', 'usuario@teste.com');
        await page.fill('#password', 'senha123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/home');

    });

    test('falha - credenciais incorretas', async ({ page }: { page: Page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Credenciais inválidas' })
            });
        });

        await page.fill('#email', 'errado@teste.com');
        await page.fill('#password', 'senhaerrada');
        await page.click('button[type="submit"]');
        await expect(page.getByRole('heading', { name: 'Dados Inválidos' })).toBeVisible();
        await expect(page.getByText('Credenciais inválidas')).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page).toHaveURL('/login');
    });

    test('falha - campos vazios', async ({ page }: { page: Page }) => {
        await page.click('button[type="submit"]');
        const emailInvalido = await page.locator('#email').evaluate((input) => {
            return (input as HTMLInputElement).matches(':invalid');
        });
        expect(emailInvalido).toBeTruthy();
        await expect(page).toHaveURL('/login');
    })
})