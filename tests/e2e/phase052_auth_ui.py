import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000")


def load_env():
    names = ["E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD", "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD"]
    if os.environ.get("E2E_OWNER_A_EMAIL"):
        return {name: os.environ[name] for name in names}
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


def login_and_onboard(page, email, password, organization_name):
    page.goto(BASE + "/login", wait_until="domcontentloaded")
    page.get_by_label("E-mail").fill(email)
    page.get_by_label("Senha").fill(password)
    page.get_by_role("button", name="Entrar").click()
    page.wait_for_url("**/dashboard", timeout=30000)
    if page.get_by_role("heading", name=re.compile("Crie sua organiza")).count():
        page.locator("input").fill(organization_name)
        page.get_by_role("button", name=re.compile("Criar organiza")).click()
        page.wait_for_timeout(1200)
        page.reload(wait_until="domcontentloaded")
    return page.url, "Crie sua organiza" not in page.locator("body").inner_text()


def main():
    env = load_env()
    report = {"owner_a": {}, "owner_b": {}, "logout": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        page.on("console", lambda message: report["console_errors"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
        url, onboarded = login_and_onboard(page, env["E2E_OWNER_A_EMAIL"], env["E2E_OWNER_A_PASSWORD"], "Nexus Codex Org A")
        page.reload(wait_until="domcontentloaded")
        report["owner_a"] = {"dashboard": url.endswith("/dashboard"), "onboarded": onboarded, "refresh": page.url.endswith("/dashboard")}
        page.locator("aside button").filter(has_text="Mariana Costa").click()
        page.get_by_role("button", name="Sair do sistema").click()
        page.wait_for_url("**/login", timeout=30000)
        report["logout"] = {"redirect_login": page.url.endswith("/login")}
        url, onboarded = login_and_onboard(page, env["E2E_OWNER_B_EMAIL"], env["E2E_OWNER_B_PASSWORD"], "Nexus Codex Org B")
        report["owner_b"] = {"dashboard": url.endswith("/dashboard"), "onboarded": onboarded}
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
