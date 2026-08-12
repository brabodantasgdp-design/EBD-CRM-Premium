"""Codex 04.1 App Router gate: deep links, refresh, history, 404 and mobile navigation."""

import json
import re
from playwright.sync_api import expect, sync_playwright

BASE_URL = "http://127.0.0.1:3000"
CRM_ROUTES = ["/dashboard", "/leads", "/contatos", "/empresas", "/negocios", "/tarefas", "/agenda"]
EXPLICIT_ROUTES = CRM_ROUTES + ["/produtos", "/propostas", "/relatorios", "/automacoes", "/copilot", "/configuracoes"]
NAV_LABELS = {"/dashboard": "Dashboard", "/leads": "Leads", "/contatos": "Contatos", "/empresas": "Empresas", "/negocios": "Negócios", "/tarefas": "Tarefas", "/agenda": "Agenda"}


def main():
    report = {"deep_links": {}, "refresh": {}, "history": False, "not_found": False, "active_nav": {}, "mobile": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        cdp = page.context.new_cdp_session(page)
        cdp.send("Network.setCacheDisabled", {"cacheDisabled": True})
        page.on("console", lambda msg: (report["console_errors"].append(msg.text), print("CONSOLE", msg.text)) if msg.type == "error" else None)
        page.on("pageerror", lambda error: (report["page_errors"].append(str(error)), print("PAGEERROR", error)))

        for path in EXPLICIT_ROUTES:
            route_page = browser.new_page(viewport={"width": 1366, "height": 900})
            route_page.goto(BASE_URL + path, wait_until="commit")
            route_page.wait_for_selector("main", timeout=15000)
            expect(route_page.locator("main")).to_be_visible()
            report["deep_links"][path] = route_page.url.endswith(path)
            route_page.close()

        for path in CRM_ROUTES:
            page.goto(BASE_URL + path, wait_until="commit")
            page.wait_for_selector("main", timeout=15000)
            page.reload(wait_until="commit")
            page.wait_for_selector("main", timeout=15000)
            expect(page.locator("main")).to_be_visible()
            report["refresh"][path] = page.url.endswith(path)
            expect(page.locator("aside").get_by_role("link", name=re.compile(re.escape(NAV_LABELS[path]), re.I)).first).to_be_visible()

        page.goto(BASE_URL + "/dashboard", wait_until="networkidle")
        page.get_by_role("link", name=re.compile("^Leads")).first.click()
        page.wait_for_url(re.compile(r"/leads/?$"))
        page.get_by_role("link", name="Empresas", exact=True).first.click()
        page.wait_for_url(re.compile(r"/empresas/?$"))
        page.go_back(); page.wait_for_url(re.compile(r"/leads/?$"))
        page.go_forward(); page.wait_for_url(re.compile(r"/empresas/?$"))
        report["history"] = page.url.endswith("/empresas") and page.locator("aside").get_by_role("link", name="Empresas", exact=True).first.get_attribute("href") == "/empresas"

        page.goto(BASE_URL + "/rota-inexistente", wait_until="networkidle")
        expect(page.get_by_text("Página não encontrada", exact=True)).to_be_visible()
        report["not_found"] = True

        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(BASE_URL + "/dashboard", wait_until="networkidle")
        expect(page.locator("nav")).to_be_visible()
        page.locator("nav a[href='/leads']").click()
        page.wait_for_url(re.compile(r"/leads/?$"))
        page.locator("nav").get_by_role("button", name="Mais", exact=True).click()
        page.get_by_role("link", name="Contatos", exact=True).last.click()
        page.wait_for_url(re.compile(r"/contatos/?$"))
        report["mobile"] = {"bottom_nav": True, "more_sheet": True, "route_switch": True, "overflow": page.evaluate("document.documentElement.scrollWidth > window.innerWidth") is False}

        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
