import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

def env_value(name):
    for line in Path('.env.local').read_text(encoding='utf-8').splitlines():
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    return os.environ.get(name, '')

base = 'http://localhost:3000'
email = env_value('E2E_OWNER_A_EMAIL')
password = env_value('E2E_OWNER_A_PASSWORD')
report = {'routes': {}, 'errors': [], 'viewports': {}}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()
    page.on('console', lambda msg: report['errors'].append({'type': 'console', 'text': msg.text}) if msg.type == 'error' else None)
    page.on('pageerror', lambda error: report['errors'].append({'type': 'pageerror', 'text': str(error)}))
    responses = []
    def capture(response):
        if response.status >= 400 and 'localhost:3000' in response.url:
            item = {'url': response.url, 'status': response.status}
            try:
                item['body_start'] = response.text()[:240]
            except Exception:
                pass
            responses.append(item)
    page.on('response', capture)

    page.goto(base + '/login', wait_until='domcontentloaded', timeout=15000)
    page.locator('input[type="email"]').fill(email)
    page.locator('input[type="password"]').fill(password)
    report['input_lengths'] = {
        'email': page.locator('input[type="email"]').input_value().__len__(),
        'password': page.locator('input[type="password"]').input_value().__len__(),
    }
    page.get_by_role('button', name='Entrar').click()
    page.wait_for_timeout(3000)
    if '/dashboard' not in page.url:
        report['login_failure_body'] = page.locator('body').inner_text()[:500]
        report['login_failure_url'] = page.url
        report['responses_4xx_5xx'] = responses
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()
        raise SystemExit(1)
    report['login'] = page.url.endswith('/dashboard')

    for path in ['/empresas', '/contatos']:
        page.goto(base + path, wait_until='domcontentloaded', timeout=15000)
        page.wait_for_timeout(1500)
        body = page.locator('body').inner_text()
        report['routes'][path] = {
            'status': 200,
            'has_mock_names': any(name in body for name in ['Lumina Tech', 'Apex', 'Grupo Horizonte', 'Ana Martins', 'Carlos Henrique']),
            'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),
            'body_start': body[:220],
        }
        if path == '/empresas':
            page.get_by_role('button', name='Nova Empresa').click()
            report['routes'][path]['create_modal'] = page.get_by_text('Nova Empresa (Conta B2B)').count() > 0
            page.keyboard.press('Escape')
        else:
            page.get_by_role('button', name='+ Novo Contato').click()
            report['routes'][path]['create_modal'] = page.get_by_text('Novo Contato').count() > 0
            page.keyboard.press('Escape')

    report['responses_4xx_5xx'] = responses
    page.set_viewport_size({'width': 390, 'height': 844})
    for path in ['/empresas', '/contatos']:
        page.goto(base + path, wait_until='domcontentloaded', timeout=15000)
        page.wait_for_timeout(1500)
        report['viewports'].setdefault('390', {})[path] = {
            'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),
            'title': page.title(),
        }
    browser.close()

print(json.dumps(report, ensure_ascii=False, indent=2))
