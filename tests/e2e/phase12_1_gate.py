import json, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ["E2E_BASE_URL"].rstrip("/")
def values():
    result = {}
    for line in Path('.env.local').read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1); result[key] = value.strip().strip('"').strip("'")
    for key in ('E2E_VIEWER_A_EMAIL','E2E_VIEWER_A_PASSWORD','E2E_SUSPENDED_A_EMAIL','E2E_SUSPENDED_A_PASSWORD'):
        if os.getenv(key): result[key] = os.environ[key]
    return result

v = values(); marker = 'phase121-' + str(os.getpid()); report = {'preview': BASE, 'console': [], 'pageerrors': [], 'server5xx': []}
def login(ctx, email, password):
    response = ctx.request.post(BASE + '/api/auth/login', form={'email': email, 'password': password, 'next': '/dashboard'})
    if response.status < 200 or response.status >= 300: raise AssertionError(f'login status {response.status}')
def api(page, path, method='GET', body=None):
    return page.evaluate("""async ({path, method, body}) => { const r = await fetch(path, {method, credentials:'include', headers: body ? {'content-type':'application/json'} : undefined, body: body ? JSON.stringify(body) : undefined}); let b=null; try { b=await r.json(); } catch {} return {status:r.status, body:b}; }""", {'path': path, 'method': method, 'body': body})

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width':1366,'height':900}, extra_http_headers={'x-vercel-protection-bypass': v['VERCEL_AUTOMATION_BYPASS_SECRET']})
    page = ctx.new_page(); page.on('console', lambda m: report['console'].append(m.text) if m.type == 'error' else None); page.on('pageerror', lambda e: report['pageerrors'].append(str(e))); page.on('response', lambda r: report['server5xx'].append({'url':r.url,'status':r.status}) if r.status >= 500 else None)
    login(ctx, v['E2E_OWNER_A_EMAIL'], v['E2E_OWNER_A_PASSWORD']); page.goto(BASE + '/produtos', wait_until='domcontentloaded'); page.wait_for_timeout(1800)
    page.get_by_role('button', name='Novo produto').click(); page.locator('input[placeholder="Nome"]').fill(marker+' Product'); page.locator('input[placeholder="Preço"]').fill('1000'); page.locator('textarea[placeholder="Descrição"]').fill('Phase 12.1');
    with page.expect_response(lambda r: r.request.method == 'POST' and '/api/commercial/products' in r.url and r.status < 300) as product_create: page.get_by_role('button', name='Salvar').click()
    page.wait_for_timeout(500); report['product_create'] = product_create.value.status
    page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(1200); row = page.get_by_text(marker+' Product', exact=True).first; expect(row).to_be_visible(); row.locator('xpath=ancestor::tr').get_by_role('button', name=re.compile('Editar')).click(); page.locator('input[placeholder="Preço"]').fill('1500')
    with page.expect_response(lambda r: r.request.method == 'PATCH' and '/api/commercial/products/' in r.url and r.status < 300) as product_edit: page.get_by_role('button', name='Salvar').click()
    page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(1000); report['product_edit_refresh'] = product_edit.value.status; expect(page.get_by_text('R$ 1.500,00').first).to_be_visible()
    page.on('dialog', lambda dialog: dialog.accept()); page.get_by_role('button', name=re.compile('Arquivar')).first.click(); page.wait_for_timeout(800); page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(1000); report['product_archive_refresh'] = page.get_by_text(marker+' Product', exact=True).count() == 0
    page.goto(BASE + '/propostas', wait_until='domcontentloaded'); page.wait_for_timeout(1500); page.get_by_role('button', name='Nova proposta').click(); page.locator('select').select_option(index=1); page.locator('input[placeholder="Título"]').fill(marker+' Proposal'); page.locator('select[aria-label="Produto do item 1"]').select_option(index=1); page.locator('input[aria-label="Quantidade do item 1"]').fill('2'); page.locator('input[aria-label="Preço do item 1"]').fill('1000'); page.get_by_role('button', name='Adicionar item').click(); page.locator('input[aria-label="Descrição do item 2"]').fill(marker+' Manual'); page.locator('input[aria-label="Preço do item 2"]').fill('0.01'); page.locator('input[aria-label="Quantidade do item 2"]').fill('1');
    with page.expect_response(lambda r: r.request.method == 'POST' and '/api/commercial/proposals' in r.url and r.status < 300) as proposal_create: page.get_by_role('button', name='Criar proposta').click()
    page.wait_for_timeout(1300); report['proposal_create'] = proposal_create.value.status; expect(page.get_by_text(marker+' Proposal', exact=True)).to_be_visible(); card = page.get_by_text(marker+' Proposal', exact=True).locator('..').locator('..'); report['multiple_items'] = marker+' Manual' in card.inner_text() and card.get_by_text(re.compile('Consultoria|Product')).count() >= 1
    remove_button = page.get_by_role('button', name='Remover item 2'); remove_button.click(); page.wait_for_timeout(1000); page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(1000); report['remove_item_refresh'] = page.get_by_text(marker+' Manual', exact=True).count() == 0
    page.get_by_role('button', name='Marcar enviada').click(); page.wait_for_timeout(900); page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(800); report['status_sent'] = page.get_by_text('sent', exact=True).count() >= 1; page.get_by_role('button', name='Aceitar').click(); page.wait_for_timeout(900); page.reload(wait_until='domcontentloaded'); page.wait_for_timeout(800); report['status_accepted'] = page.get_by_text('accepted', exact=True).count() >= 1
    proposal_api = api(page, '/api/commercial/proposals'); report['proposal_persisted'] = any(marker in json.dumps(proposal_api['body']) for _ in [0])
    page.goto(BASE + '/negocios', wait_until='domcontentloaded'); page.wait_for_timeout(1500); deal_id = api(page, '/api/commercial/deals')['body']['deals'][0]['id']; page.get_by_test_id('deal-row-'+deal_id).click(); page.wait_for_timeout(800); page.get_by_text(re.compile('Produtos')).click(); page.wait_for_timeout(900); report['deal_drawer'] = page.get_by_text(re.compile('PROP-|accepted')).count() >= 1
    for width in (390, 1366):
        page.set_viewport_size({'width':width,'height':844}); page.goto(BASE+'/produtos', wait_until='domcontentloaded'); page.wait_for_timeout(700); report[f'viewport_{width}'] = page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    owner_products = api(page, '/api/commercial/products'); report['owner_products'] = owner_products['status'] == 200
    for role, email, password in [('viewer','E2E_VIEWER_A_EMAIL','E2E_VIEWER_A_PASSWORD'),('suspended','E2E_SUSPENDED_A_EMAIL','E2E_SUSPENDED_A_PASSWORD')]:
        role_ctx = browser.new_context(viewport={'width':1366,'height':900}, extra_http_headers={'x-vercel-protection-bypass': v['VERCEL_AUTOMATION_BYPASS_SECRET']}); role_page = role_ctx.new_page(); login(role_ctx, v[email], v[password]); role_page.goto(BASE+'/produtos', wait_until='domcontentloaded'); role_page.wait_for_timeout(1200); products = api(role_page, '/api/commercial/products'); proposals = api(role_page, '/api/commercial/proposals'); create = api(role_page, '/api/commercial/products', 'POST', {'name':marker+' blocked','unit_price':1}); proposal_write = api(role_page, '/api/commercial/proposals', 'POST', {'dealId':'00000000-0000-0000-0000-000000000000','title':'blocked','items':[]}); report[role] = {'products_get':products['status'], 'proposals_get':proposals['status'], 'create_blocked':create['status'] >= 400, 'proposal_create_blocked':proposal_write['status'] >= 400, 'write_ui_hidden':role_page.get_by_role('button', name='Novo produto').count() == 0}; role_ctx.close()
    favicon = ctx.request.get(BASE+'/favicon.ico'); report['favicon'] = favicon.status
    for key in ('product_create','proposal_create'): report[key] = report[key] < 300
    print(json.dumps(report, ensure_ascii=False, indent=2)); browser.close()
