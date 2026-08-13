import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

def env_values():
    values = {}
    for line in Path('.env.local').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1); values[key.strip()] = value.strip()
    return values

v = env_values(); base = 'http://localhost:3000'; errors = []; marker = 'codex13-ui'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in (390, 1366):
        context = browser.new_context(viewport={'width': width, 'height': 900})
        page = context.new_page(); page_errors = []; console_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        response = context.request.post(base + '/api/auth/login', form={'email': v['E2E_OWNER_A_EMAIL'], 'password': v['E2E_OWNER_A_PASSWORD'], 'next': '/automacoes'})
        if response.status not in (200, 302): errors.append(f'login-{width}:{response.status}')
        page.goto(base + '/automacoes', wait_until='networkidle'); page.wait_for_timeout(700)
        if page.get_by_test_id('automations-page').count() != 1: errors.append(f'page-{width}')
        if page.locator('body').inner_text().find('Automações') < 0: errors.append(f'text-{width}')
        if page_errors: errors.append(f'pageerror-{width}')
        if console_errors: errors.append(f'console-{width}')
        context.close()
    browser.close()
print(json.dumps({'ui': not errors, 'mobile': True, 'desktop': True, 'errors': errors}))
if errors: raise SystemExit(1)
