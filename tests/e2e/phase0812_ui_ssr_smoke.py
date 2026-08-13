import json
import os
import re
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-aukx1xlhx-gestao-de-sistema.vercel.app").rstrip("/")


def env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


def login_http(values):
    headers = {
        "x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"],
        "content-type": "application/x-www-form-urlencoded",
    }
    body = urllib.parse.urlencode({"email": values["E2E_OWNER_A_EMAIL"], "password": values["E2E_OWNER_A_PASSWORD"], "next": "/dashboard"}).encode()
    request = urllib.request.Request(BASE + "/api/auth/login", data=body, headers=headers, method="POST")
    try:
        response = urllib.request.urlopen(request, timeout=60)
    except urllib.error.HTTPError as error:
        raise AssertionError(f"HTTP login failed: {error.code}") from error
    cookies = []
    for raw in response.headers.get_all("Set-Cookie") or []:
        parsed = SimpleCookie()
        parsed.load(raw)
        for name, morsel in parsed.items():
            cookies.append({"name": name, "value": morsel.value, "domain": urllib.parse.urlparse(BASE).hostname, "path": morsel["path"] or "/", "secure": bool(morsel["secure"])})
    payload = json.loads(response.read().decode())
    assert 200 <= response.status < 300 and cookies and payload.get("redirectTo") == "/dashboard"
    return cookies


def run():
    values = env()
    cookies = login_http(values)
    report = {"auth_http": "PASS", "checks": [], "console": [], "pageerrors": [], "unexpected": []}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        context.add_cookies(cookies)
        page = context.new_page()
        page.on("console", lambda message: report["console"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["pageerrors"].append(str(error)))
        page.on("response", lambda response: report["unexpected"].append({"url": response.url, "status": response.status}) if response.status >= 500 else None)

        def check(name, passed, detail=None):
            report["checks"].append({"name": name, "passed": bool(passed), **({"detail": detail} if detail else {})})
            if not passed:
                raise AssertionError(name)

        def open_deals(viewport=None):
            if viewport:
                page.set_viewport_size(viewport)
            page.goto(BASE + "/negocios", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(1800)
            check("authenticated_deals", page.url.endswith("/negocios"))

        def api(path, method="GET", payload=None):
            return page.evaluate("""async ({path, method, payload}) => { const response = await fetch(path, {method, credentials:'include', headers: payload ? {'content-type':'application/json'} : undefined, body: payload ? JSON.stringify(payload) : undefined}); let body=null; try { body=await response.json(); } catch {} return {status:response.status, body}; }""", {"path": path, "method": method, "payload": payload})

        open_deals()
        pipelines = api("/api/commercial/pipelines")["body"]["pipelines"]
        pipeline = pipelines[0]
        stages = pipeline["stages"]
        opens = [stage for stage in stages if stage.get("stageType") == "open"]
        won = next(stage for stage in stages if stage.get("stageType") == "won")
        lost = next(stage for stage in stages if stage.get("stageType") == "lost")
        companies = api("/api/commercial/companies")["body"]["companies"]
        contacts = api("/api/commercial/contacts")["body"]["contacts"]
        company = companies[0] if companies else None
        contact = contacts[0] if contacts else None

        def make(name, stage):
            response = api("/api/commercial/deals", "POST", {"name": name, "companyId": company["id"] if company else None, "contactId": contact["id"] if contact else None, "pipelineId": pipeline["id"], "stageId": stage["id"], "ownerId": None, "value": 1111, "probability": stage["probability"], "status": "open", "expectedCloseDate": "2026-12-31"})
            check("fixture_" + name, response["status"] == 201, response["status"])
            return response["body"]["deal"]["id"]

        create_name = "UI Smoke Create " + str(os.getpid())
        page.get_by_test_id("new-deal-button").click()
        modal = page.get_by_test_id("deal-form-modal")
        modal.locator("input[type=text]").first.fill(create_name)
        modal.get_by_test_id("deal-value-field").fill("2345")
        with page.expect_response(lambda response: response.request.method == "POST" and "/api/commercial/deals" in response.url and response.status < 300, timeout=30000):
            modal.get_by_role("button", name=re.compile("Criar Neg", re.I)).click()
        page.wait_for_timeout(800)
        check("ui_create_visible", page.get_by_text(create_name, exact=True).count() > 0)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(3000)
        check("ui_create_refresh", page.get_by_text(create_name, exact=True).count() > 0)

        edit_id = make("UI Smoke Edit", opens[0])
        move_id = make("UI Smoke Move", opens[0])
        won_id = make("UI Smoke Won", opens[0])
        lost_id = make("UI Smoke Lost", opens[0])
        reopen_id = make("UI Smoke Reopen", won)
        archive_id = make("UI Smoke Archive", opens[0])
        bulk_ids = [make("UI Smoke Bulk A", opens[0]), make("UI Smoke Bulk B", opens[0])]
        prepared_reopen = api(f"/api/commercial/deals/{reopen_id}/won", "POST")
        check("reopen_fixture_won", prepared_reopen["status"] < 300, prepared_reopen["status"])

        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        page.get_by_test_id("deals-list-view").click(); page.wait_for_timeout(500)
        row = page.get_by_test_id(f"deal-row-{edit_id}")
        row.get_by_test_id(f"deal-actions-{edit_id}").click(); page.get_by_text(re.compile("Editar Neg", re.I)).click()
        edit_modal = page.get_by_test_id("deal-form-modal")
        edit_modal.locator("input[type=text]").first.fill("UI Smoke Edit Updated")
        edit_modal.get_by_test_id("deal-value-field").fill("9876")
        with page.expect_response(lambda response: response.request.method == "PATCH" and f"/api/commercial/deals/{edit_id}" in response.url and response.status < 300, timeout=30000):
            edit_modal.get_by_role("button", name=re.compile("Atualizar Neg", re.I)).click()
        page.wait_for_timeout(700); check("ui_edit", page.get_by_text("UI Smoke Edit Updated", exact=True).count() > 0)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(3000)
        edit_after_reload = api(f"/api/commercial/deals/{edit_id}")
        check("ui_edit_refresh", page.get_by_text("UI Smoke Edit Updated", exact=True).count() > 0, edit_after_reload)

        page.get_by_test_id("deals-kanban-view").last.click(); page.wait_for_timeout(500)
        move_card = page.get_by_test_id(f"kanban-card-{move_id}")
        move_card.get_by_title(re.compile("Opções|OpÃ§Ãµes", re.I)).click()
        target = opens[1] if len(opens) > 1 else opens[0]
        with page.expect_response(lambda response: response.request.method == "POST" and f"/api/commercial/deals/{move_id}/move" in response.url and response.status < 300, timeout=30000):
            page.locator("div.absolute.z-30").get_by_role("button", name=target["name"], exact=True).click()
        page.wait_for_timeout(700); page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(700)
        check("ui_move_refresh", page.get_by_test_id(f"kanban-card-{move_id}").get_attribute("data-stage-id") == target["id"])

        page.get_by_test_id("deals-list-view").click(); page.wait_for_timeout(500)
        def action(deal_id, button_text, endpoint, modal_button=None):
            page.get_by_test_id("deals-list-view").click(); page.wait_for_timeout(400)
            page.get_by_test_id(f"deal-actions-{deal_id}").click(); page.get_by_text(re.compile(button_text, re.I)).click()
            if modal_button:
                page.get_by_role("button", name=re.compile(modal_button, re.I)).click()
            with page.expect_response(lambda response: response.request.method == "POST" and endpoint in response.url and response.status < 300, timeout=30000):
                if not modal_button:
                    page.get_by_text(re.compile(button_text, re.I)).last.click()
            page.wait_for_timeout(600)

        # Won uses a deterministic test id after the menu opens.
        page.get_by_test_id(f"deal-actions-{won_id}").click()
        with page.expect_response(lambda response: response.request.method == "POST" and f"/api/commercial/deals/{won_id}/won" in response.url and response.status < 300, timeout=30000):
            page.get_by_test_id(f"mark-deal-won-{won_id}").click()
        page.wait_for_timeout(700); check("ui_won", page.get_by_test_id(f"deal-row-{won_id}").count() == 1)

        page.get_by_test_id(f"deal-actions-{lost_id}").click(); page.get_by_text(re.compile("Marcar como Perdido", re.I)).click()
        with page.expect_response(lambda response: response.request.method == "POST" and f"/api/commercial/deals/{lost_id}/lost" in response.url and response.status < 300, timeout=30000):
            page.get_by_role("button", name=re.compile("Confirmar Perda", re.I)).click()
        page.wait_for_timeout(700); check("ui_lost", page.get_by_test_id(f"deal-row-{lost_id}").count() == 1)

        page.get_by_text("Ganhos", exact=True).last.click(); page.wait_for_timeout(500)
        page.get_by_test_id(f"deal-actions-{reopen_id}").click(); page.get_by_text(re.compile("Reabrir Neg", re.I)).click()
        with page.expect_response(lambda response: response.request.method == "POST" and f"/api/commercial/deals/{reopen_id}/reopen" in response.url and response.status < 300, timeout=30000):
            page.get_by_role("button", name=re.compile("Confirmar Reabertura", re.I)).click()
        page.wait_for_timeout(700); check("ui_reopen", page.get_by_test_id(f"deal-row-{reopen_id}").count() == 1)

        page.get_by_test_id(f"deal-actions-{archive_id}").click(); page.get_by_text(re.compile("Arquivar Neg", re.I)).click()
        page.wait_for_timeout(700); check("ui_archive", page.get_by_test_id(f"deal-row-{archive_id}").count() == 0)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(700); check("ui_archive_refresh", page.get_by_test_id(f"deal-row-{archive_id}").count() == 0)

        page.set_viewport_size({"width": 390, "height": 844}); page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("mobile_open", page.url.endswith("/negocios")); check("mobile_no_overflow", page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        page.set_viewport_size({"width": 1366, "height": 900}); page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("desktop_open", page.url.endswith("/negocios")); check("desktop_kanban", page.get_by_test_id("deals-kanban-view").count() > 0); check("desktop_table", page.get_by_test_id("deals-list-view").count() > 0)
        report["mobile"] = "PASS"; report["desktop"] = "PASS"
        browser.close()
    print(json.dumps(report, ensure_ascii=True))


if __name__ == "__main__":
    run()
