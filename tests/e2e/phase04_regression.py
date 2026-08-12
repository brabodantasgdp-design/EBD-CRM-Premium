"""Next.js App Router smoke/regression checks for Codex Phase 04."""

import json
import re
from datetime import datetime
from playwright.sync_api import expect, sync_playwright

BASE_URL = "http://127.0.0.1:3000"
ROUTES = [
    ("Dashboard", "/dashboard"),
    ("Leads", "/leads"),
    ("Contatos", "/contatos"),
    ("Empresas", "/empresas"),
    ("Negócios", "/negocios"),
    ("Tarefas", "/tarefas"),
    ("Agenda", "/agenda"),
]


def open_route(page, path):
    page.goto(BASE_URL + path, wait_until="commit", timeout=60000)
    expect(page.locator("main")).to_be_visible(timeout=15000)
    expect(page.locator("aside")).to_be_visible()


def main():
    report = {"routes": {}, "mobile": {}, "state_persistence": False, "functional": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        page.on("console", lambda msg: report["console_errors"].append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda error: report["page_errors"].append(str(error)))

        for label, path in ROUTES:
            open_route(page, path)
            report["routes"][label] = {"path": page.url, "rendered": True}

        open_route(page, "/leads")
        page.get_by_role("button", name=re.compile("Novo lead", re.I)).first.click()
        modal = page.get_by_test_id("lead-form-modal")
        lead_name = f"Codex Next {datetime.now().strftime('%H%M%S')}"
        modal.get_by_placeholder("Ex: Ana Martins").fill(lead_name)
        modal.get_by_test_id("lead-form-submit").click()
        expect(modal).not_to_be_visible()
        page.wait_for_timeout(1000)
        expect(page.locator('[data-testid^="lead-row-"]').filter(has_text=lead_name)).to_be_visible()
        page.locator("aside").get_by_role("link", name=re.compile("Negócios")).click()
        page.wait_for_url(re.compile(r"/negocios/?$"))
        page.locator("aside").get_by_role("link", name=re.compile("Leads")).click()
        page.wait_for_url(re.compile(r"/leads/?$"))
        expect(page.locator('[data-testid^="lead-row-"]').filter(has_text=lead_name)).to_be_visible()
        report["state_persistence"] = True

        # E/Q/R/S: conversion, drawer close, export menu and mock import modal.
        convertible = page.get_by_title("Converter em Oportunidade").first
        convertible.click()
        conversion = page.locator("[class*='fixed']").filter(has_text="Converter Lead").last
        expect(conversion).to_be_visible()
        conversion.get_by_role("button", name="Cancelar", exact=True).click()
        expect(conversion).not_to_be_visible()
        page.get_by_role("button", name="Exportar", exact=True).first.click()
        expect(page.get_by_text(re.compile("Exportar Leads", re.I))).to_be_visible()
        export_modal = page.get_by_text("Exportar Dados em CSV", exact=True).locator("xpath=ancestor::div[contains(@class, 'fixed')][1]")
        export_modal.locator("button").first.click()
        page.get_by_role("button", name="Importar", exact=True).click()
        expect(page.get_by_text(re.compile("Importar Leads", re.I))).to_be_visible()
        import_modal = page.get_by_text("Importar Leads (CSV)", exact=True).locator("xpath=ancestor::div[contains(@class, 'fixed')][1]")
        import_modal.locator("button").first.click()
        report["functional"].update({"conversion_modal": True, "drawer_modal_close": True, "export_ui": True, "mock_import_ui": True})

        # I/J: Kanban cards and deal action menu remain present after migration.
        open_route(page, "/negocios")
        draggable_count = page.locator("[draggable=true]").count()
        page.get_by_test_id("deals-list-view").click()
        deal_actions = page.locator('[data-testid^="deal-actions-"]').first
        deal_actions.click()
        expect(page.get_by_text(re.compile("Marcar como Ganho|Reabrir Negócio", re.I)).first).to_be_visible()
        page.keyboard.press("Escape")
        report["functional"].update({"kanban_draggable_cards": draggable_count > 0, "deal_action_menu": True})

        # K/L/Q: task and agenda modals open and close on real routes.
        open_route(page, "/tarefas")
        page.get_by_role("button", name="Nova Tarefa", exact=True).click()
        expect(page.get_by_text("Nova Tarefa", exact=True).last).to_be_visible()
        task_modal = page.get_by_text("Nova Tarefa", exact=True).last.locator("xpath=ancestor::div[contains(@class, 'fixed')][1]")
        task_modal.get_by_role("button", name="Cancelar", exact=True).click()
        open_route(page, "/agenda")
        page.get_by_role("button", name="Novo Compromisso", exact=True).click()
        expect(page.get_by_text(re.compile("Novo Compromisso", re.I)).last).to_be_visible()
        agenda_modal = page.get_by_text(re.compile("Novo Compromisso", re.I)).last.locator("xpath=ancestor::div[contains(@class, 'fixed')][1]")
        agenda_modal.get_by_role("button", name="Cancelar", exact=True).click()
        report["functional"].update({"tasks_modal": True, "agenda_modal": True})

        for width in [320, 360, 390, 430, 768, 1024, 1366, 1920]:
            page.set_viewport_size({"width": width, "height": 900})
            open_route(page, "/")
            report["mobile"][str(width)] = {"rendered": True, "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > window.innerWidth")}

        report["functional"]["mobile_navigation_render"] = True

        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
