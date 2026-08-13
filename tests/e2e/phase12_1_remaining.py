import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ['E2E_BASE_URL'].rstrip('/'); env={}
for line in Path('.env.local').read_text(encoding='utf-8-sig').splitlines():
    if '=' in line: k,v=line.split('=',1); env[k]=v.strip().strip('"').strip("'")
for k in ('E2E_VIEWER_A_EMAIL','E2E_VIEWER_A_PASSWORD','E2E_SUSPENDED_A_EMAIL','E2E_SUSPENDED_A_PASSWORD'):
    if os.getenv(k): env[k]=os.environ[k]
def login(ctx,email,password):
    r=ctx.request.post(base+'/api/auth/login',form={'email':email,'password':password,'next':'/dashboard'}); assert 200<=r.status<300, r.status
def api(page,path,method='GET',body=None): return page.evaluate("""async x=>{let r=await fetch(x.path,{method:x.method,credentials:'include',headers:x.body?{'content-type':'application/json'}:undefined,body:x.body?JSON.stringify(x.body):undefined});let b=null;try{b=await r.json()}catch{}return {status:r.status,body:b}}""",{'path':path,'method':method,'body':body})
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox']); c=b.new_context(viewport={'width':1366,'height':900},extra_http_headers={'x-vercel-protection-bypass':env['VERCEL_AUTOMATION_BYPASS_SECRET']}); page=c.new_page(); login(c,env['E2E_OWNER_A_EMAIL'],env['E2E_OWNER_A_PASSWORD']); page.goto(base+'/negocios',wait_until='domcontentloaded'); page.wait_for_timeout(1200); deal=api(page,'/api/commercial/deals')['body']['deals'][0]['id']; page.get_by_test_id('deals-list-view').click(); page.wait_for_timeout(500); page.get_by_test_id('deal-row-'+deal).click(); page.wait_for_timeout(800); page.get_by_text('Produtos',exact=True).click(); page.wait_for_timeout(800); print(json.dumps({'deal_drawer_proposals':page.get_by_text('Propostas persistentes',exact=True).count()==1,'favicon':c.request.get(base+'/favicon.ico').status},indent=2))
    for role,ek,pk in [('viewer','E2E_VIEWER_A_EMAIL','E2E_VIEWER_A_PASSWORD'),('suspended','E2E_SUSPENDED_A_EMAIL','E2E_SUSPENDED_A_PASSWORD')]:
        rc=b.new_context(viewport={'width':1366,'height':900},extra_http_headers={'x-vercel-protection-bypass':env['VERCEL_AUTOMATION_BYPASS_SECRET']}); rp=rc.new_page(); login(rc,env[ek],env[pk]); rp.goto(base+'/produtos',wait_until='domcontentloaded'); rp.wait_for_timeout(900); get=api(rp,'/api/commercial/products'); prop=api(rp,'/api/commercial/proposals'); write=api(rp,'/api/commercial/products','POST',{'name':'blocked','unit_price':1}); print(json.dumps({role:{'products':get['status'],'proposals':prop['status'],'mutation_blocked':write['status']>=400,'write_ui_hidden':rp.get_by_role('button',name='Novo produto').count()==0}},indent=2)); rc.close()
    b.close()
