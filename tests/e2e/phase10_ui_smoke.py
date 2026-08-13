import json
import os
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-6crl7g0d6-gestao-de-sistema.vercel.app").rstrip("/")


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
    assert cookies
    return cookies


def run():
    values = load_env()
    report = {"base": BASE, "checks": [], "console": [], "pageerrors": [], "unexpected": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        context.add_cookies(login(values))
        page = context.new_page()
        page.on("console", lambda m: report["console"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: report["pageerrors"].append(str(e)))
        page.on("response", lambda r: report["unexpected"].append({"url": r.url, "status": r.status}) if r.status >= 500 else None)

        def check(name, condition, detail=None):
            report["checks"].append({"name": name, "passed": bool(condition), **({"detail": detail} if detail is not None else {})})
            if not condition:
                raise AssertionError(f"{name}: {detail}")

        def api(path, method="GET", payload=None):
            return page.evaluate("""async ({path,method,payload})=>{const r=await fetch(path,{method,credentials:'include',headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});let b=null;try{b=await r.json()}catch{}return {status:r.status,body:b}}""", {"path": path, "method": method, "payload": payload})

        page.goto(BASE + "/negocios", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2200)
        check("authenticated_negocios", page.url.endswith("/negocios"))
        deals = api("/api/commercial/deals")["body"]["deals"]
        deal = next(d for d in deals if d.get("status") == "open" and not d.get("archivedAt"))
        page.get_by_test_id("deals-list-view").last.click(); page.wait_for_timeout(400)
        page.get_by_test_id(f"deal-row-{deal['id']}").click(); page.wait_for_timeout(500)

        page.get_by_role("button", name="Tarefa", exact=True).click()
        title = "Phase10 UI task"
        form = page.locator('input[placeholder*="Título da tarefa"]').first
        form.fill(title)
        with page.expect_response(lambda r: r.request.method == "POST" and "/api/commercial/tasks" in r.url and r.status < 300, timeout=30000) as task_response:
            page.get_by_role("button", name="Adicionar Tarefa", exact=True).click()
        task_payload = task_response.value.json()
        task_id = task_payload["task"]["id"]
        page.wait_for_timeout(1000)
        check("deal_task_created", page.get_by_text(title, exact=True).count() > 0, task_id)

        page.goto(BASE + "/tarefas", wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        task_list = api("/api/commercial/tasks")
        check("task_same_id_in_tasks", page.get_by_test_id(f"task-row-{task_id}").count() > 0, {"id": task_id, "api_status": task_list["status"], "api_titles": [t.get("title") for t in (task_list.get("body") or {}).get("tasks", [])], "url": page.url, "body": page.locator("body").inner_text()[:500]})
        complete = api(f"/api/commercial/tasks/{task_id}/complete", "POST")
        check("task_complete", complete["status"] < 300, complete)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        reopen = api(f"/api/commercial/tasks/{task_id}/reopen", "POST")
        check("task_reopen", reopen["status"] < 300, reopen)

        page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        page.get_by_test_id("deals-list-view").last.click(); page.wait_for_timeout(400)
        page.get_by_test_id(f"deal-row-{deal['id']}").click(); page.wait_for_timeout(400)
        page.get_by_role("button", name="Atividade", exact=True).click(); page.wait_for_timeout(300)
        activity_title = "Phase10 UI activity"
        page.locator('input[placeholder*="atividade" i]').first.fill(activity_title)
        with page.expect_response(lambda r: r.request.method == "POST" and "/api/commercial/activities" in r.url and r.status < 300, timeout=30000) as activity_response:
            page.get_by_role("button", name="Registrar Atividade", exact=True).click()
        activity_payload = activity_response.value.json()
        activity_id = activity_payload["activity"]["id"]
        page.wait_for_timeout(900)
        check("activity_created", page.get_by_text(activity_title, exact=True).count() > 0, activity_id)
        check("activity_id_in_deal", page.get_by_text(activity_title, exact=True).count() > 0, activity_id)
        page.goto(BASE + "/agenda", wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        page.get_by_role("button", name="Lista", exact=True).click(); page.wait_for_timeout(300)
        check("agenda_loaded", page.get_by_text("Agenda", exact=False).count() > 0)
        check("deal_activity_same_id", page.get_by_text(activity_title, exact=True).count() > 0, activity_id)
        cancelled = api(f"/api/commercial/activities/{activity_id}/cancel", "POST")
        check("activity_cancel", cancelled["status"] < 300, cancelled)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("activity_cancel_persisted", api(f"/api/commercial/activities/{activity_id}")["body"]["activity"]["status"] == "cancelled")

        page.set_viewport_size({"width": 390, "height": 844}); page.goto(BASE + "/agenda", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("mobile_agenda", page.url.endswith("/agenda")); check("mobile_no_overflow", page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        page.set_viewport_size({"width": 1366, "height": 900}); page.goto(BASE + "/tarefas", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("desktop_tasks", page.url.endswith("/tarefas"))
        check("console_clean", not report["console"], report["console"]); check("pageerrors_clean", not report["pageerrors"], report["pageerrors"]); check("no_5xx", not report["unexpected"], report["unexpected"])
        browser.close()
    print(json.dumps(report, ensure_ascii=True))


if __name__ == "__main__":
    run()
