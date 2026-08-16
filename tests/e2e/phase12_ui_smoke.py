import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from helpers.organization_guard import require_isolated_e2e_organization

require_isolated_e2e_organization({"E2E_ORGANIZATION_ID": os.getenv("E2E_ORGANIZATION_ID")})

def env(name):
    for line in Path('.env.local').read_text(encoding='utf-8-sig').splitlines():
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    return os.getenv(name, '')

email = env('E2E_OWNER_A_EMAIL'); password = env('E2E_OWNER_A_PASSWORD')
if not email or not password: raise RuntimeError('E2E credentials unavailable')
errors = []
base = os.getenv('BASE_URL', 'http://localhost:3000')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in (1366, 390):
        context = browser.new_context(viewport={"width": width, "height": 900})
        page = context.new_page()
        page.on('console', lambda message: errors.append(f'console:{message.text}') if message.type == 'error' else None)
        page.on('pageerror', lambda error: errors.append(f'pageerror:{error}'))
        for _ in range(5):
            page.goto(base + '/login', wait_until='networkidle')
            if page.locator('input[type=email]').count() > 0: break
            page.wait_for_timeout(2500)
        if page.locator('input[type=email]').count() == 0:
            raise AssertionError(f'login form missing url={page.url} title={page.title()} body={page.locator("body").inner_text()[:500]}')
        page.locator('input[type=email]').fill(email); page.locator('input[type=password]').fill(password); page.get_by_role('button', name='Entrar').click()
        page.wait_for_url('**/dashboard', timeout=15000)
        page.goto(base + '/produtos', wait_until='networkidle')
        page.get_by_role('button', name='Novo produto').click()
        page.locator('input[placeholder="Nome"]').fill(f'UI Phase12 {width}')
        page.locator('input[placeholder="Preço"]').fill('12345.67')
        page.locator('textarea[placeholder="Descrição"]').fill('Produto UI determinístico')
        page.get_by_role('button', name='Salvar').click(); page.wait_for_timeout(800)
        if not page.get_by_text(f'UI Phase12 {width}').first.is_visible(): raise AssertionError('product not visible after create')
        if page.locator('body').evaluate('(node) => node.scrollWidth > node.clientWidth'): raise AssertionError(f'overflow products {width}')
        page.goto(base + '/propostas', wait_until='networkidle')
        page.get_by_role('button', name='Nova proposta').click()
        page.locator('select').select_option(index=1)
        page.locator('input[placeholder="Título"]').fill(f'UI Proposal {width}')
        page.locator('input[placeholder="Descrição do item"]').fill('Consultoria')
        page.locator('input[placeholder="Valor"]').fill('1000')
        page.get_by_role('button', name='Criar proposta').click(); page.wait_for_timeout(1000)
        if not page.get_by_text(f'UI Proposal {width}').first.is_visible(): raise AssertionError('proposal not visible after create')
        if page.locator('body').evaluate('(node) => node.scrollWidth > node.clientWidth'): raise AssertionError(f'overflow proposals {width}')
        context.close()
    browser.close()
if errors: raise AssertionError(' ; '.join(errors[:10]))
print('phase12 ui smoke passed: desktop=1366 mobile=390 console_errors=0 pageerrors=0')
