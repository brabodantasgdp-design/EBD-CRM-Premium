import json
import os
import re
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-4nukjvjw8-gestao-de-sistema.vercel.app").rstrip("/")


def load_env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


def login(values):
    body = urllib.parse.urlencode({"email": values["E2E_OWNER_A_EMAIL"], "password": values["E2E_OWNER_A_PASSWORD"], "next": "/dashboard"}).encode()
    request = urllib.request.Request(BASE + "/api/auth/login", data=body, method="POST", headers={"content-type": "application/x-www-form-urlencoded", "x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
    response = urllib.request.urlopen(request, timeout=60)
    cookies = []
    for raw in response.headers.get_all("Set-Cookie") or []:
        parsed = SimpleCookie(); parsed.load(raw)
        for name, morsel in parsed.items():
            cookies.append({"name": name, "value": morsel.value, "domain": urllib.parse.urlparse(BASE).hostname, "path": morsel["path"] or "/", "secure": bool(morsel["secure"])})
    assert 200 <= response.status < 300 and cookies
    return cookies


def run():
    values = load_env(); report = {"checks": [], "console": [], "pageerrors": [], "unexpected": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        context.add_cookies(login(values)); page = context.new_page()
        page.on("console", lambda m: report["console"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: report["pageerrors"].append(str(e)))
        page.on("response", lambda r: report["unexpected"].append({"url": r.url, "status": r.status}) if r.status >= 500 else None)

        def api(path, method="GET", payload=None):
            return page.evaluate("""async ({path,method,payload})=>{const r=await fetch(path,{method,credentials:'include',headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});let b=null;try{b=await r.json()}catch{}return {status:r.status,body:b}}""", {"path": path, "method": method, "payload": payload})

        def check(name, condition, detail=None):
            report["checks"].append({"name": name, "passed": bool(condition), **({"detail": detail} if detail is not None else {})})

        page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        companies = api("/api/commercial/companies")["body"]["companies"]
        contacts = api("/api/commercial/contacts")["body"]["contacts"]
        deals = api("/api/commercial/deals")["body"]["deals"]
        related = next((d for d in deals if d.get("companyId") and d.get("contactId") and not d.get("archivedAt")), None)
        if not related: raise AssertionError("No real Deal with Company and Contact relation")
        company = next(c for c in companies if c["id"] == related["companyId"])
        contact = next(c for c in contacts if c["id"] == related["contactId"])
        check("real_relation", related["organizationId"] == company["organizationId"] == contact["organizationId"], related["id"])

        page.goto(BASE + "/empresas", wait_until="domcontentloaded"); page.wait_for_timeout(1300)
        page.get_by_text(company["name"], exact=True).first.click(); page.wait_for_timeout(500)
        page.get_by_role("button", name=re.compile("Neg.*cios", re.I)).last.click(); page.wait_for_timeout(300)
        check("company_drawer_deal", page.get_by_text(related["name"], exact=True).count() > 0, related["id"])
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        page.get_by_text(company["name"], exact=True).first.click(); page.wait_for_timeout(300)
        page.get_by_role("button", name=re.compile("Neg.*cios", re.I)).last.click(); page.wait_for_timeout(300)
        check("company_refresh", page.get_by_text(related["name"], exact=True).count() > 0, related["id"])

        page.goto(BASE + "/contatos", wait_until="domcontentloaded"); page.wait_for_timeout(1300)
        page.get_by_text(contact["fullName"], exact=True).first.click(); page.wait_for_timeout(500)
        page.get_by_role("button", name=re.compile("Neg.*cios", re.I)).last.click(); page.wait_for_timeout(300)
        check("contact_drawer_deal", page.get_by_text(related["name"], exact=True).count() > 0, related["id"])
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        page.get_by_text(contact["fullName"], exact=True).first.click(); page.wait_for_timeout(300)
        page.get_by_role("button", name=re.compile("Neg.*cios", re.I)).last.click(); page.wait_for_timeout(300)
        check("contact_refresh", page.get_by_text(related["name"], exact=True).count() > 0)

        open_deals = [d for d in deals if d.get("status") == "open" and not d.get("archivedAt") and d.get("pipelineId") == related.get("pipelineId")]
        open_deals = open_deals[:2]
        control_deal = next((d for d in [x for x in deals if x.get("status") == "open" and not x.get("archivedAt") and x.get("pipelineId") == related.get("pipelineId")] if d["id"] not in {o["id"] for o in open_deals}), None)
        check("bulk_fixture", len(open_deals) == 2, [d["id"] for d in open_deals])
        if len(open_deals) == 2:
            page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1500); page.get_by_test_id("deals-list-view").last.click(); page.wait_for_timeout(400)
            for deal in open_deals:
                row = page.get_by_test_id(f"deal-row-{deal['id']}")
                row.locator("input[type=checkbox]").check()
            check("bulk_selected_two", page.locator("input[type=checkbox]:checked").count() == 2)
            page.get_by_test_id("deals-bulk-stage-trigger").click(); page.wait_for_timeout(300)
            pipeline = next(p for p in api("/api/commercial/pipelines")["body"]["pipelines"] if p["id"] == related["pipelineId"])
            current_stage_ids = {d.get("stageId") for d in open_deals}
            target_stage = next(s for s in pipeline["stages"] if s["id"] not in current_stage_ids and s.get("stageType") == "open")
            stage_button = page.get_by_test_id(f"deals-bulk-stage-{target_stage['id']}")
            if stage_button.count():
                with page.expect_response(lambda r: r.request.method == "POST" and "/move" in r.url and r.status < 300, timeout=30000): stage_button.click()
                page.wait_for_timeout(800); page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1200)
                refreshed = api("/api/commercial/deals")["body"]["deals"]
                refreshed_by_id = {d["id"]: d for d in refreshed}
                api_bulk = all(refreshed_by_id.get(d["id"], {}).get("stageId") == target_stage["id"] for d in open_deals)
                control_unchanged = control_deal is None or refreshed_by_id.get(control_deal["id"], {}).get("stageId") == control_deal.get("stageId")
                check("bulk_stage_refresh", api_bulk and control_unchanged, {"api": api_bulk, "control": control_unchanged})
            else: check("bulk_stage_ui", False, "stage menu unavailable")

        page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        deals = api("/api/commercial/deals")["body"]["deals"]
        active = [d for d in deals if not d.get("archivedAt") and d.get("pipelineId") == related.get("pipelineId")]
        open_items = [d for d in active if d.get("status") == "open"]
        won_items = [d for d in active if d.get("status") == "won"]
        expected_open = sum(float(d.get("value", 0)) for d in open_items)
        expected_forecast = sum(float(d.get("value", 0)) * float(d.get("probability", 0)) / 100 for d in open_items)
        expected_won = len(won_items)
        body = page.locator("body").inner_text()
        money = lambda n: re.sub(r"\s+", " ", f"R$ {n:,.0f}".replace(",", "X").replace(".", ",").replace("X", ".")).replace("R$ ", "R$ ")
        normalize = lambda text: re.sub(r"\s+", " ", text.replace("\xa0", " "))
        open_text = page.get_by_test_id("deals-kpi-open-pipeline").inner_text()
        forecast_text = page.get_by_test_id("deals-kpi-forecast").inner_text()
        won_text = page.get_by_test_id("deals-kpi-won").inner_text()
        check("kpi_open", money(expected_open) in normalize(open_text), {"expected": expected_open, "rendered": open_text})
        check("kpi_forecast", money(expected_forecast) in normalize(forecast_text), {"expected": expected_forecast, "rendered": forecast_text})
        check("kpi_won", str(expected_won) in won_text, {"expected": expected_won, "rendered": won_text})
        check("console_clean", not report["console"]); check("pageerrors_clean", not report["pageerrors"]); check("no_5xx", not report["unexpected"])
        browser.close()
    print(json.dumps(report, ensure_ascii=True))


if __name__ == "__main__": run()
