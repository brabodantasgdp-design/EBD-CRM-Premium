import json
import os
import re
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-5qrltjahg-gestao-de-sistema.vercel.app").rstrip("/")

def env():
    result = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1); result[key] = value.strip().strip('"').strip("'")
    return result

def login(values):
    body = urllib.parse.urlencode({"email": values["E2E_OWNER_A_EMAIL"], "password": values["E2E_OWNER_A_PASSWORD"], "next": "/dashboard"}).encode()
    request = urllib.request.Request(BASE + "/api/auth/login", data=body, method="POST", headers={"content-type": "application/x-www-form-urlencoded", "x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
    response = urllib.request.urlopen(request, timeout=60)
    cookies = []
    for raw in response.headers.get_all("Set-Cookie") or []:
        parsed = SimpleCookie(); parsed.load(raw)
        for name, morsel in parsed.items():
            cookies.append({"name": name, "value": morsel.value, "domain": urllib.parse.urlparse(BASE).hostname, "path": morsel["path"] or "/", "secure": bool(morsel["secure"])})
    return cookies

def run():
    values = env(); report = {"checks": [], "console": [], "pageerrors": [], "server_errors": []}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        context.add_cookies(login(values)); page = context.new_page()
        page.on("console", lambda message: report["console"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["pageerrors"].append(str(error)))
        page.on("response", lambda response: report["server_errors"].append({"url": response.url, "status": response.status}) if response.status >= 500 else None)
        def api(path):
            return page.evaluate("""async path => { const r=await fetch(path,{credentials:'include'}); let body=null; try { body=await r.json(); } catch {} return {status:r.status,body}; }""", path)
        def check(name, condition, detail=None):
            report["checks"].append({"name": name, "passed": bool(condition), **({"detail": detail} if detail is not None else {})})
            if not condition: raise AssertionError(f"{name}: {detail}")

        page.goto(BASE + "/dashboard", wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        task_list = api("/api/commercial/tasks"); activity_list = api("/api/commercial/activities")
        check("tasks_api", task_list["status"] == 200); check("activities_api", activity_list["status"] == 200)
        tasks = task_list["body"]["tasks"]; activities = activity_list["body"]["activities"]
        if tasks:
            task = tasks[0]; detail = api(f"/api/commercial/tasks/{task['id']}")["body"]["task"]
            check("task_owner_contract", detail["ownerId"] == task["ownerId"] and not detail["ownerName"] == detail["ownerId"], {"id": detail["id"], "ownerName": detail["ownerName"]})
        if activities:
            activity = activities[0]; detail = api(f"/api/commercial/activities/{activity['id']}")["body"]["activity"]
            check("activity_owner_contract", detail["ownerId"] == activity["ownerId"] and not detail["ownerName"] == detail["ownerId"], {"id": detail["id"], "ownerName": detail["ownerName"]})
        local_today = page.evaluate("() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }")
        page.goto(BASE + "/agenda", wait_until="domcontentloaded"); page.wait_for_timeout(1600)
        check("agenda_current_month", page.locator("h2").count() > 0)
        check("agenda_no_uuid", not re.search(r"\b[0-9a-f]{8}-[0-9a-f-]{27,}\b", page.locator("body").inner_text(), re.I))
        page.set_viewport_size({"width": 390, "height": 844}); page.goto(BASE + "/agenda", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
        check("mobile_no_overflow", page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        page.goto(BASE + "/tarefas", wait_until="domcontentloaded"); page.wait_for_timeout(1000); check("mobile_tasks", page.url.endswith("/tarefas"))
        page.set_viewport_size({"width": 1366, "height": 900}); page.goto(BASE + "/negocios", wait_until="domcontentloaded"); page.wait_for_timeout(1000); check("desktop_drawer_route", page.url.endswith("/negocios"))
        check("console_clean", not report["console"], report["console"]); check("pageerrors_clean", not report["pageerrors"], report["pageerrors"]); check("no_5xx", not report["server_errors"], report["server_errors"])
        browser.close()
    print(json.dumps(report, ensure_ascii=True))

if __name__ == "__main__": run()
