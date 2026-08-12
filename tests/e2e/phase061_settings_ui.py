import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE = "https://crmpro-q3t1byg71-gestao-de-sistema.vercel.app"

def env_values():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values

def main():
    env = env_values()
    report = {"checks": {}, "console_errors": [], "page_errors": [], "http_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": env["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        page = context.new_page()
        page.on("console", lambda message: report["console_errors"].append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
        page.on("response", lambda response: report["http_errors"].append({"status": response.status, "url": response.url}) if response.status >= 400 and "favicon" not in response.url else None)

        page.goto(BASE + "/login", wait_until="networkidle", timeout=60000)
        page.get_by_label("E-mail").fill(env["E2E_OWNER_A_EMAIL"])
        page.get_by_label("Senha").fill(env["E2E_OWNER_A_PASSWORD"])
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/dashboard", timeout=60000)
        page.goto(BASE + "/configuracoes", wait_until="networkidle", timeout=60000)
        report["checks"]["settings_shell"] = page.get_by_role("heading", name="Configurações").count() == 1
        report["checks"]["company"] = page.get_by_text("Minha Empresa", exact=True).count() >= 1 and bool(page.locator("input").first.input_value())
        page.get_by_role("button", name="Equipe").click()
        page.wait_for_timeout(500)
        report["checks"]["team"] = page.get_by_text("Convites pendentes", exact=True).count() == 1 and page.get_by_text("sales", exact=True).count() >= 1
        rows = page.locator("tbody tr")
        if rows.count() >= 2:
            sales_row = rows.nth(1)
            sales_row.locator("select").select_option("manager")
            page.wait_for_timeout(600)
            sales_row = page.locator("tbody tr").nth(1)
            sales_row.locator("select").select_option("sales")
            page.wait_for_timeout(600)
            page.locator("tbody tr").nth(1).get_by_text("Suspender", exact=True).click()
            page.wait_for_timeout(600)
            page.locator("tbody tr").nth(1).get_by_text("Reativar", exact=True).click()
            page.wait_for_timeout(600)
            report["checks"]["owner_member_actions"] = True
        else:
            report["checks"]["owner_member_actions"] = False
        page.get_by_placeholder("e-mail@empresa.com").fill(f"phase061-{int(time.time())}@example.test")
        page.get_by_role("button", name="Convidar").click()
        page.wait_for_timeout(800)
        report["checks"]["invite_created"] = "Convite criado" in page.locator("body").inner_text() or page.get_by_text("Link de teste:", exact=False).count() == 1
        report["checks"]["token_not_in_console"] = not any("token=" in entry.lower() for entry in report["console_errors"])
        page.get_by_text("Revogar", exact=True).first.click()
        page.wait_for_timeout(800)
        report["checks"]["invite_revoked"] = page.get_by_text("Convite revogado", exact=False).count() == 1
        page.get_by_role("button", name="Papéis e Permissões").click()
        report["checks"]["roles"] = page.get_by_text("owner", exact=True).count() == 1 and page.get_by_text("Sem gestão de equipe", exact=True).count() >= 2
        page.screenshot(path=".tmp-phase061-desktop.png", full_page=True)

        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(BASE + "/configuracoes", wait_until="networkidle", timeout=60000)
        page.get_by_role("button", name="Equipe").click()
        report["checks"]["mobile_team"] = page.get_by_text("Convites pendentes", exact=True).count() == 1
        report["checks"]["mobile_no_overflow"] = page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        page.screenshot(path=".tmp-phase061-mobile.png", full_page=True)
        report["checks"]["console_clean"] = len(report["console_errors"]) == 0
        report["checks"]["pageerror_clean"] = len(report["page_errors"]) == 0
        report["checks"]["http_clean"] = len(report["http_errors"]) == 0
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()

if __name__ == "__main__":
    main()
