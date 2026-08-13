import json
import os
import re
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-5qrltjahg-gestao-de-sistema.vercel.app").rstrip("/")

def load_env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1); values[key] = value.strip().strip('"').strip("'")
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
    return cookies

def run():
    values = load_env(); report = {"checks": [], "console": [], "pageerrors": [], "server_errors": []}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        context.add_cookies(login(values)); page = context.new_page()
        page.on("console", lambda message: report["console"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["pageerrors"].append(str(error)))
        page.on("response", lambda response: report["server_errors"].append({"url": response.url, "status": response.status}) if response.status >= 500 else None)
        def check(name, condition, detail=None):
            report["checks"].append({"name": name, "passed": bool(condition), **({"detail": detail} if detail is not None else {})})
            if not condition: raise AssertionError(f"{name}: {detail}")
        page.goto(BASE + "/dashboard", wait_until="domcontentloaded", timeout=60000); page.wait_for_timeout(2200)
        check("dashboard_loaded", page.url.endswith("/dashboard"))
        body = page.locator("body").inner_text()
        check("no_prototype_disclaimer", "dados simulados" not in body.lower() and "protótipo de front-end" not in body.lower())
        check("no_fixed_pipeline_copy", not re.search(r"\b47 negócios\b", body, re.I))
        check("kpi_pipeline", page.get_by_test_id("metric-open-pipeline").count() == 1)
        check("kpi_won", page.get_by_test_id("metric-won-deals").count() == 1)
        check("today_activity_section", page.get_by_test_id("dashboard-activities-today").count() == 1)
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1800); check("hard_reload", page.url.endswith("/dashboard"))
        page.set_viewport_size({"width": 390, "height": 844}); page.goto(BASE + "/dashboard", wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        check("mobile_no_overflow", page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        page.set_viewport_size({"width": 1366, "height": 900}); check("desktop_width", page.evaluate("window.innerWidth === 1366"))
        check("console_clean", not report["console"], report["console"]); check("pageerrors_clean", not report["pageerrors"], report["pageerrors"]); check("no_5xx", not report["server_errors"], report["server_errors"])
        browser.close()
    print(json.dumps(report, ensure_ascii=True))

if __name__ == "__main__": run()
