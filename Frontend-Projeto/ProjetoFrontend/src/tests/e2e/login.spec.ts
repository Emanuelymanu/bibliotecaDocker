import {test, expect, type Page} from '@playwright/test';

test.describe('Login', ()=> {
    test.beforeEach(async({page}:{page: Page})=>{
        await page.goto('/login');
    });

    test('sucesso - credenciais corretas', async ({page}: {page: Page})=>{
        await page.fill('input[name="email"]' , 'usuario@teste.com');
        await page.fill('input[name="password"]' , 'senha123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/home');
    
    });

    test('falha - credenciais incorretas', async ({page}: {page: Page})=> {
        await page.fill('input[name="email"]' , 'errado@teste.com');
        await page.fill('input[name="password"]' , 'senhaerrada');
        await page.click('button[type="submit"]');
        await expect(page.locator('.error-message')).toBeVisible();
        await expect(page).toHaveURL('/login');
    });

    test('falha - campos vazios', async ({page}: {page: Page})=> {
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Campo obrigatório')).toBeVisible();
    })
})