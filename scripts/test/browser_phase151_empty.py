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
report = {'login': None, 'organizations': None, 'select': None, 'empty_report': None, 'errors': [], 'viewports': {}}

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
    login_response = login_info.value
    report['login'] = login_response.status
    page.wait_for_timeout(1500)

    organizations_result = page.evaluate("""async () => { const response = await fetch('/api/organizations', { cache: 'no-store' }); return { status: response.status, body: await response.json() }; }""")
    organizations_status = organizations_result['status']
    organizations_body = organizations_result['body']
    organizations = organizations_body.get('organizations', []) if isinstance(organizations_body, dict) else []
    empty = next((item for item in organizations if (item.get('organizations') or {}).get('name') == 'Nexus QA Empty Organization'), None)
    report['organizations'] = {'status': organizations_status, 'count': len(organizations), 'empty_found': bool(empty)}
    if not empty:
        raise RuntimeError(json.dumps({'status': organizations_status, 'body_keys': sorted(organizations_body.keys()) if isinstance(organizations_body, dict) else [], 'organization_keys': [sorted(item.keys()) for item in organizations if isinstance(item, dict)]}, ensure_ascii=False))

    select_result = page.evaluate("""async (organizationId) => { const response = await fetch('/api/organizations/select', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId }) }); return { status: response.status }; }""", empty['organization_id'])
    report['select'] = {'status': select_result['status']}
    if select_result['status'] != 200:
        raise RuntimeError('empty organization selection failed')

    page.goto(base + '/relatorios', wait_until='domcontentloaded', timeout=30000)
    page.wait_for_timeout(3000)
    body = page.locator('body').inner_text()
    report['empty_report'] = {
        'route': '/relatorios' in page.url,
        'reports_page': page.get_by_test_id('reports-page').count() == 1,
        'empty_state': 'Ainda não há dados para este relatório' in body,
        'shows_zero_revenue': 'R$ 0,00' in body,
        'has_fake_placeholder': any(value in body for value in ['dados simulados', 'Módulo em preparação', 'Protótipo']),
    }
    for width in [390, 1366]:
        page.set_viewport_size({'width': width, 'height': 844 if width == 390 else 900})
        page.reload(wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(1500)
        report['viewports'][str(width)] = {
            'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),
            'reports_page': page.get_by_test_id('reports-page').count() == 1,
        }
    browser.close()

print(json.dumps(report, ensure_ascii=False, indent=2))
if report['errors'] or report['login'] != 200 or report['select']['status'] != 200 or not report['empty_report']['route'] or not report['empty_report']['reports_page'] or not report['empty_report']['empty_state'] or report['empty_report']['has_fake_placeholder'] or any(item['overflow'] or not item['reports_page'] for item in report['viewports'].values()):
    raise SystemExit(1)
