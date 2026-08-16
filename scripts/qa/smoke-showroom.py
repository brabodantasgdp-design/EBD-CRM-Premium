import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "").rstrip("/")
ROUTES = ["/dashboard", "/leads", "/contatos", "/empresas", "/negocios", "/tarefas", "/agenda", "/propostas", "/relatorios"]


def load_env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


def main():
    values = load_env()
    if not BASE or not values.get("E2E_OWNER_A_EMAIL") or not values.get("E2E_OWNER_A_PASSWORD") or not values.get("VERCEL_AUTOMATION_BYPASS_SECRET"):
        raise RuntimeError("read-only showroom smoke environment is incomplete")
    report = {"base": BASE, "viewports": {}, "console": [], "pageerrors": [], "5xx": [], "4xx": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        for width in (390, 1366):
            context = browser.new_context(viewport={"width": width, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
            login = context.request.post(BASE + "/api/auth/login", form={"email": values["E2E_OWNER_A_EMAIL"], "password": values["E2E_OWNER_A_PASSWORD"], "next": "/dashboard"}, headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
            if not 200 <= login.status < 300:
                raise RuntimeError(f"login failed with status {login.status}")
            page = context.new_page()
            errors = []
            page_errors = []
            server_errors = []
            client_errors = []
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.on("response", lambda response: server_errors.append({"url": response.url, "status": response.status}) if response.status >= 500 else None)
            page.on("response", lambda response: client_errors.append({"url": response.url, "status": response.status}) if 400 <= response.status < 500 and "/api/" in response.url else None)
            routes = {}
            for route in ROUTES:
                response = page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(500)
                routes[route] = {"status": response.status if response else None, "url": page.url}
            report["viewports"][str(width)] = routes
            report["console"].extend(errors)
            report["pageerrors"].extend(page_errors)
            report["5xx"].extend(server_errors)
            report["4xx"].extend(client_errors)
            context.close()
        browser.close()
    print(json.dumps(report, ensure_ascii=False))
    if report["console"] or report["pageerrors"] or report["5xx"] or any(item["status"] != 200 for viewport in report["viewports"].values() for item in viewport.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
