import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright


def env_value(name):
    for line in Path('.env.local').read_text(encoding='utf-8').splitlines():
        if line.startswith(name + '='):
            return line.split('=', 1)[1].strip().strip('"')
    return ''


base = os.environ.get('E2E_BASE_URL', 'http://localhost:3000')
email = env_value('E2E_OWNER_A_EMAIL')
password = env_value('E2E_OWNER_A_PASSWORD')
bypass = env_value('VERCEL_AUTOMATION_BYPASS_SECRET')
routes = ['/leads', '/empresas', '/contatos', '/negocios', '/tarefas', '/agenda']
mock_names = ['Mariana Costa', 'Lucas Mendes', 'Camila Rocha', 'Rafael Souza', 'Roberto Alves']
forbidden_text = ['Demonstração visual', 'Módulo em preparação', 'dados simulados', 'Este protótipo']
report = {'login': None, 'empty_org': None, 'routes': {}, 'errors': []}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1366, 'height': 900},
        extra_http_headers={'x-vercel-protection-bypass': bypass} if bypass else None,
    )
    page = context.new_page()
    page.on('console', lambda msg: report['errors'].append({'type': 'console'}) if msg.type == 'error' else None)
    page.on('pageerror', lambda error: report['errors'].append({'type': 'pageerror'}))
    page.goto(base + '/login', wait_until='domcontentloaded', timeout=30000)
    page.locator('input[type="email"]').wait_for(state='visible', timeout=30000)
    page.locator('input[type="email"]').fill(email)
    page.locator('input[type="password"]').fill(password)
    with page.expect_response(lambda response: '/api/auth/login' in response.url, timeout=30000) as login_info:
        page.get_by_role('button', name='Entrar').click()
    report['login'] = login_info.value.status
    page.wait_for_timeout(1500)

    organizations = page.evaluate("""async () => { const response = await fetch('/api/organizations', { cache: 'no-store' }); return { status: response.status, body: await response.json() }; }""")
    empty = next((item for item in organizations['body'].get('organizations', []) if (item.get('organizations') or {}).get('name') == 'Nexus QA Empty Organization'), None)
    if not empty:
        raise RuntimeError('empty organization fixture not found')
    selected = page.evaluate("""async (organizationId) => { const response = await fetch('/api/organizations/select', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId }) }); return response.status; }""", empty['organization_id'])
    report['empty_org'] = {'organizations_status': organizations['status'], 'select_status': selected}
    if selected != 200:
        raise RuntimeError('empty organization selection failed')

    for route in routes:
        page.goto(base + route, wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(2500)
        body = page.locator('body').inner_text()
        found_mock_names = [name for name in mock_names if name in body]
        found_forbidden = [text for text in forbidden_text if text in body]
        report['routes'][route] = {
            'rendered': page.url.endswith(route),
            'mock_names_visible': found_mock_names,
            'demo_text_visible': found_forbidden,
            'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),
        }
    browser.close()

print(json.dumps(report, ensure_ascii=False, indent=2))
if report['errors'] or report['login'] != 200 or report['empty_org']['select_status'] != 200 or any(not result['rendered'] or result['mock_names_visible'] or result['demo_text_visible'] or result['overflow'] for result in report['routes'].values()):
    raise SystemExit(1)
