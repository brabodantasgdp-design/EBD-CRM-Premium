import json, os, re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
from helpers.organization_guard import require_isolated_e2e_organization

def env_values():
    values = {}
    for line in Path('.env.local').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1); values[key.strip()] = value.strip()
    return values

v = env_values(); require_isolated_e2e_organization(v); base = os.environ.get('PHASE13_BASE', 'https://crmpro-p0q0ed8ju-gestao-de-sistema.vercel.app'); bypass = v['VERCEL_AUTOMATION_BYPASS_SECRET']; report = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in (390, 1366):
        context = browser.new_context(viewport={'width': width, 'height': 900}, extra_http_headers={'x-vercel-protection-bypass': bypass})
        page = context.new_page(); page_errors = []; console_errors = []; failed = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        page.on('requestfailed', lambda request: failed.append(request.url))
        login = context.request.post(base + '/api/auth/login', form={'email': v['E2E_OWNER_A_EMAIL'], 'password': v['E2E_OWNER_A_PASSWORD'], 'next': '/automacoes'}, headers={'x-vercel-protection-bypass': bypass}, timeout=60000)
        page.goto(base + '/automacoes', wait_until='networkidle', timeout=60000); page.wait_for_timeout(1200)
        if width == 1366:
            for old in page.request.get(base + '/api/automations').json().get('automations', []):
                if old.get('name', '').startswith('codex13-ui-'): page.request.delete(base + f"/api/automations/{old['id']}")
            now = datetime.now(timezone.utc)
            for old in page.request.get(base + '/api/follow-ups').json().get('followUps', []):
                if old.get('type') == 'reminder' and old.get('status') == 'scheduled' and abs((datetime.fromisoformat(old['scheduled_for'].replace('Z', '+00:00')) - now).total_seconds()) < 600:
                    page.request.patch(base + f"/api/follow-ups/{old['id']}", data={'status': 'cancelled'})
        ui_create = False; automation_id = None; follow_id = None; create_status = None; create_body = None
        if width == 1366:
            marker = f'codex13-ui-{int(datetime.now().timestamp())}'
            page.get_by_placeholder('Nome da automação').fill(marker)
            with page.expect_response(lambda response: response.request.method == 'POST' and '/api/automations' in response.url) as create_response:
                page.get_by_role('button', name='Criar como rascunho').click()
            create_status = create_response.value.status; full_body = create_response.value.json(); create_body = json.dumps(full_body)[:200]; automation_id = full_body.get('automation', {}).get('id'); page.wait_for_timeout(1200)
            card = page.locator('[data-testid^="automation-"]').filter(has_text=marker); card.first.wait_for(timeout=5000); ui_create = card.count() == 1
            if ui_create:
                card.get_by_role('button', name='Ativar automação').click(); page.wait_for_timeout(500); card.get_by_role('button', name='Dry-run').click(); page.wait_for_timeout(300); card.get_by_role('button', name='Execuções').click();
                deals = page.request.get(base + '/api/commercial/deals').json().get('deals', [])
                if deals:
                    created_follow = page.request.post(base + '/api/follow-ups', data={'entityType': 'deal', 'entityId': deals[0]['id'], 'type': 'reminder', 'scheduledFor': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()})
                    if created_follow.ok: follow_id = created_follow.json()['followUp']['id']; page.reload(wait_until='networkidle'); page.get_by_role('button', name=re.compile('Follow-ups')).click(); page.wait_for_timeout(500); page.get_by_text('Concluir', exact=True).first.click();
        report[str(width)] = {'login': login.status, 'page': page.get_by_test_id('automations-page').count() == 1, 'api': page.get_by_text('Automações', exact=True).count() > 0, 'uiCreate': ui_create, 'createStatus': create_status, 'createBody': create_body, 'pageErrors': len(page_errors), 'consoleErrors': len(console_errors), 'failedRequests': failed[:3]}
        if automation_id: page.request.delete(base + f'/api/automations/{automation_id}')
        if follow_id: page.request.patch(base + f'/api/follow-ups/{follow_id}', data={'status': 'cancelled'})
        context.close()
    browser.close()
print(json.dumps(report))
if any(item['login'] >= 400 or not item['page'] or item['pageErrors'] or item['consoleErrors'] or (item.get('uiCreate') is False and key == '1366') for key, item in report.items()): raise SystemExit(1)
