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
report = {'login': False, 'route': {}, 'api': {}, 'errors': [], 'viewports': {}, 'bypass_present': bool(bypass), 'login_responses': []}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1366, 'height': 900}, extra_http_headers={'x-vercel-protection-bypass': bypass} if bypass else None)
    page = context.new_page()
    page.on('console', lambda msg: report['errors'].append({'type': 'console', 'text': msg.text}) if msg.type == 'error' else None)
    page.on('pageerror', lambda error: report['errors'].append({'type': 'pageerror', 'text': str(error)}))
    page.on('response', lambda response: report.setdefault('login_responses', []).append({'status': response.status, 'path': response.url.rsplit('/', 1)[-1]}) if '/api/auth/login' in response.url else None)
    page.goto(base + '/login', wait_until='domcontentloaded', timeout=20000)
    page.locator('input[type="email"]').wait_for(state='visible', timeout=20000)
    page.wait_for_timeout(1000)
    page.locator('input[type="email"]').fill(email)
    page.locator('input[type="password"]').fill(password)
    try:
        with page.expect_response(lambda response: '/api/auth/login' in response.url, timeout=30000) as login_response_info:
            page.get_by_role('button', name='Entrar').click()
        login_response = login_response_info.value
        login_body = login_response.json()
        report['login_api'] = {'status': login_response.status, 'json_keys': sorted(login_body.keys()) if isinstance(login_body, dict) else []}
    except Exception as exc:
        report['login_api_error'] = type(exc).__name__
    page.wait_for_timeout(2500)
    report['login'] = '/dashboard' in page.url
    if not report['login']:
        report['login_body'] = page.locator('body').inner_text()[:300]
        print(json.dumps(report, ensure_ascii=False)); raise SystemExit(1)

    page.goto(base + '/relatorios', wait_until='domcontentloaded', timeout=20000)
    page.wait_for_timeout(7000)
    body = page.locator('body').inner_text()
    report['route'] = {
        'url': page.url,
        'reports_page': page.get_by_test_id('reports-page').count() == 1,
        'has_placeholder': any(value in body for value in ['Módulo em preparação', 'dados simulados', 'Protótipo']),
        'labels': {value: value.lower() in body.lower() for value in ['Funil por etapa', 'Receita ganha', 'Leads ativos', 'Relatórios', 'Carregando dados reais…']},
        'headings': page.locator('h1,h2,h3').all_inner_texts(),
        'article_starts': [text.split('\n')[:4] for text in page.locator('article').all_inner_texts()],
        'has_real_sections': all(value.lower() in body.lower() for value in ['Funil por etapa', 'Receita ganha', 'Leads ativos']),
        'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),
    }
    api = page.evaluate("""async () => { const response = await fetch('/api/reports?period=este_mes', { cache: 'no-store' }); const body = await response.json(); return { status: response.status, hasReport: Boolean(body.report), finite: body.report ? [body.report.kpis.revenue, body.report.kpis.forecast, body.report.closed.winRate].every(Number.isFinite) : false }; }""")
    report['api'] = api
    for width in [390, 1366]:
        page.set_viewport_size({'width': width, 'height': 844 if width == 390 else 900})
        page.reload(wait_until='domcontentloaded')
        page.wait_for_timeout(2500)
        report['viewports'][str(width)] = {'overflow': page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), 'reports_page': page.get_by_test_id('reports-page').count() == 1}
    browser.close()

print(json.dumps(report, ensure_ascii=False, indent=2))
if report['errors'] or not report['route'].get('reports_page') or not report['route'].get('has_real_sections') or report['route'].get('has_placeholder') or not report['api'].get('hasReport') or not all(item['reports_page'] and not item['overflow'] for item in report['viewports'].values()):
    raise SystemExit(1)
