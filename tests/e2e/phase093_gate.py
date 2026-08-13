import json, os, re
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("E2E_BASE_URL", "").rstrip("/")

def env():
    out = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1); out[k] = v.strip().strip('"').strip("'")
    for k in ("E2E_VIEWER_A_EMAIL", "E2E_VIEWER_A_PASSWORD", "E2E_SUSPENDED_A_EMAIL", "E2E_SUSPENDED_A_PASSWORD"):
        if os.environ.get(k): out[k] = os.environ[k]
    return out

def login(context, values, email, password):
    r = context.request.post(BASE + "/api/auth/login", form={"email": email, "password": password, "next": "/dashboard"}, headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
    if r.status < 200 or r.status >= 300: raise AssertionError(f"login {r.status}")

def api(context, path, method="GET", body=None):
    headers = {"x-vercel-protection-bypass": env()["VERCEL_AUTOMATION_BYPASS_SECRET"]}
    r = context.request.fetch(BASE + path, method=method, data=json.dumps(body) if body is not None else None, headers={**headers, **({"content-type":"application/json"} if body is not None else {})})
    try: payload = r.json()
    except Exception: payload = None
    return r.status, payload

def main():
    values = env(); marker = "phase093-" + datetime.now().strftime("%Y%m%d%H%M%S%f")
    report = {"marker": marker, "console": [], "pageerrors": [], "5xx": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width":1366,"height":900}, accept_downloads=True, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        page = ctx.new_page(); page.on("console", lambda m: report["console"].append(m.text) if m.type == "error" else None); page.on("pageerror", lambda e: report["pageerrors"].append(str(e))); page.on("response", lambda r: report["5xx"].append({"url":r.url,"status":r.status}) if r.status >= 500 else None)
        login(ctx, values, values["E2E_OWNER_A_EMAIL"], values["E2E_OWNER_A_PASSWORD"])
        fixtures = {}
        for suffix in ("a", "b", "control", "convert"):
            status, body = api(ctx, "/api/commercial/leads", "POST", {"name": f"{marker}-{suffix}", "email": f"{marker}-{suffix}@example.test", "source": "Site"})
            if status < 200 or status >= 300: raise AssertionError(f"fixture {suffix} {status}")
            fixtures[suffix] = body["lead"]["id"]
        report["fixtures"] = fixtures
        page.goto(BASE + "/leads", wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        def row(suffix): return page.get_by_test_id(f"lead-row-{fixtures[suffix]}")
        for suffix in fixtures: expect(row(suffix)).to_be_visible()

        for suffix in ("a", "b"): page.get_by_test_id(f"lead-checkbox-{fixtures[suffix]}").click()
        page.get_by_test_id("bulk-status-trigger").click()
        with page.expect_response(lambda r: r.request.method == "PATCH" and "/api/commercial/leads/bulk" in r.url) as bulk:
            page.get_by_role("button", name="Em contato", exact=True).click()
        report["bulk_status"] = {"http": bulk.value.status, "a": "Em contato" in row("a").inner_text(), "b": "Em contato" in row("b").inner_text(), "control_before": row("control").inner_text()}
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        report["bulk_refresh"] = {"a": "Em contato" in row("a").inner_text(), "b": "Em contato" in row("b").inner_text(), "control_intact": "Em contato" not in row("control").inner_text()}

        for suffix in ("a", "b"): page.get_by_test_id(f"lead-checkbox-{fixtures[suffix]}").click()
        with page.expect_response(lambda r: r.request.method == "PATCH" and "/api/commercial/leads/bulk" in r.url) as archived:
            page.get_by_test_id("bulk-archive-trigger").click()
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        report["bulk_archive"] = {"http": archived.value.status, "a_gone": row("a").count() == 0, "b_gone": row("b").count() == 0, "control_active": row("control").count() == 1}

        row("convert").get_by_title("Converter em Oportunidade").click(); form = page.locator("form").last
        for i, text in enumerate([f"{marker}-contact", f"{marker}-company", f"{marker}-deal"]): form.locator("input").nth(i).fill(text)
        with page.expect_response(lambda r: r.request.method == "POST" and "/api/commercial/leads/convert" in r.url) as conversion:
            form.get_by_role("button", name=re.compile("Converter Lead", re.I)).click()
        conv_body = conversion.value.json(); page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        report["conversion"] = {"http": conversion.value.status, "converted_refresh": "Convertido" in row("convert").inner_text(), "company_id": conv_body.get("conversion",{}).get("company_id"), "contact_id": conv_body.get("conversion",{}).get("contact_id"), "deal_id": conv_body.get("conversion",{}).get("deal_id"), "reconversion_blocked": row("convert").get_by_title("Converter em Oportunidade").count() == 0}
        for path, field in [("/api/commercial/companies", "companies"), ("/api/commercial/contacts", "contacts"), ("/api/commercial/deals", "deals")]:
            status, body = api(ctx, path); report.setdefault("related", {})[field] = status < 300 and any(marker in json.dumps(body, ensure_ascii=False) for _ in [0])

        page.get_by_role("button", name="Exportar", exact=True).first.click()
        with page.expect_download() as download:
            page.get_by_role("button", name=re.compile("Exportar Todos", re.I)).dispatch_event("click")
        content = Path(download.value.path()).read_bytes() if download.value.path() else b""
        report["export"] = marker.encode() in content

        ctx_view = browser.new_context(viewport={"width":1366,"height":900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]}); login(ctx_view, values, values["E2E_VIEWER_A_EMAIL"], values["E2E_VIEWER_A_PASSWORD"]); viewer = ctx_view.pages[0] if ctx_view.pages else ctx_view.new_page(); viewer.goto(BASE+"/leads", wait_until="domcontentloaded"); viewer.wait_for_timeout(1800)
        vstatus, vbody = api(ctx_view, "/api/commercial/leads"); viewer_role = vbody.get("role") if isinstance(vbody, dict) else None
        mstatus, _ = api(ctx_view, "/api/commercial/leads", "POST", {"name": marker+"-viewer-write"})
        report["viewer"] = {"role": viewer_role, "new_hidden": viewer.get_by_role("button", name=re.compile("Novo lead", re.I)).count()==0, "edit": viewer.get_by_title("Editar Lead").count()==0, "bulk": viewer.get_by_test_id("lead-bulk-actions").count()==0, "convert": viewer.get_by_title("Converter em Oportunidade").count()==0, "server_mutation_blocked": mstatus >= 400, "list": vstatus == 200}; ctx_view.close()
        ctx_s = browser.new_context(extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]}); login(ctx_s, values, values["E2E_SUSPENDED_A_EMAIL"], values["E2E_SUSPENDED_A_PASSWORD"]); sstatus, _ = api(ctx_s, "/api/commercial/leads"); report["suspended"] = {"blocked": sstatus >= 400}; ctx_s.close()
        page.set_viewport_size({"width":390,"height":844}); page.goto(BASE+"/leads", wait_until="domcontentloaded"); page.wait_for_timeout(1000); report["mobile"] = page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        page.set_viewport_size({"width":1366,"height":900}); page.goto(BASE+"/leads", wait_until="domcontentloaded"); page.wait_for_timeout(1600); page.get_by_title(re.compile("Tabela", re.I)).click(); page.wait_for_timeout(400); report["desktop"] = page.locator("table").count() == 1
        # Cleanup through the normal Owner session.
        for suffix in ("control", "convert"): api(ctx, f"/api/commercial/leads/{fixtures[suffix]}", "DELETE")
        browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__": main()
