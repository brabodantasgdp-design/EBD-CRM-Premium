import os
from pathlib import Path
from playwright.sync_api import sync_playwright

def env(name):
    for line in Path('.env.local').read_text(encoding='utf-8-sig').splitlines():
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    return os.getenv(name, '')

base = os.getenv('E2E_BASE_URL', 'https://crmpro-git-feat-copilot-ai-gestao-de-sistema.vercel.app')
email = env('E2E_OWNER_A_EMAIL'); password = env('E2E_OWNER_A_PASSWORD'); bypass = env('VERCEL_AUTOMATION_BYPASS_SECRET')
if not email or not password: raise RuntimeError('Owner E2E credentials unavailable')
headers = {'x-vercel-protection-bypass': bypass} if bypass else {}
results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height in ((390, 844), (1366, 768)):
        errors = []; server_errors = []
        context = browser.new_context(viewport={'width': width, 'height': height}, extra_http_headers=headers)
        page = context.new_page()
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: server_errors.append(response.url) if response.status >= 500 else None)
        login = context.request.post(base + '/api/auth/login', form={'email': email, 'password': password, 'next': '/copilot'}, headers=headers)
        if login.status != 200: raise AssertionError(f'login failed at {width}: {login.status}')
        page.goto(base + '/copilot', wait_until='networkidle')
        page.wait_for_selector('[data-testid="copilot-page"]')
        page.locator('select').nth(0).select_option('chat')
        page.locator('textarea').fill('Quais negócios abertos precisam de mais atenção?')
        page.get_by_role('button', name='Consultar Copilot').click()
        page.wait_for_function("document.body.innerText.includes('Contexto utilizado:') || document.body.innerText.includes('Copilot indisponível')", timeout=30000)
        context_visible = page.get_by_text('Contexto utilizado:', exact=False).count() > 0
        page.goto(base + '/configuracoes', wait_until='networkidle')
        page.wait_for_selector('[data-testid="ai-settings"]')
        settings_text = page.locator('[data-testid="ai-settings"]').inner_text().lower()
        connected = 'conectado' in settings_text
        key_masked = 'últimos 4' in settings_text or 'ultimos 4' in settings_text
        overflow = page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth')
        back = page.get_by_role('button', name='Voltar para a tela anterior ou para o Dashboard')
        back_visible = back.is_visible()
        results.append({'viewport': width, 'copilot': page.url.endswith('/configuracoes') and context_visible, 'settingsConnected': connected, 'keyMasked': key_masked, 'backVisible': back_visible, 'overflow': overflow, 'errors': len(errors), 'serverErrors': len(server_errors)})
        context.close()
    browser.close()

print({'viewports': results, 'pass': all(item['copilot'] and item['settingsConnected'] and item['keyMasked'] and item['backVisible'] and not item['overflow'] and item['errors'] == 0 and item['serverErrors'] == 0 for item in results)})
