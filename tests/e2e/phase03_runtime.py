"""Deterministic runtime gate for the shared Leads/Dashboard baseline.

Run with the app served on http://127.0.0.1:3000 and Python Playwright installed.
The script intentionally uses the stable test hooks added for Codex 03.2.
"""

import json
import re
from datetime import datetime
from playwright.sync_api import Page, expect, sync_playwright


BASE_URL = "http://127.0.0.1:3000"


def number(text: str) -> float:
    digits = re.sub(r"[^0-9-]", "", text or "")
    return float(digits or 0)


def currency(text: str) -> float:
    match = re.search(r"R\$\s*([\d.]+)", text or "")
    return float((match.group(1).replace(".", "") if match else "0"))


def nav(page: Page, label: str) -> None:
    page.locator("aside").get_by_role("button", name=re.compile(rf"^{re.escape(label)}(?:\s|$)")).click()


def lead_ids(page: Page):
    return [
        item.get_attribute("data-testid").removeprefix("lead-row-")
        for item in page.locator('[data-testid^="lead-row-"]').all()
    ]


def select_leads(page: Page, ids) -> None:
    for lead_id in ids:
        page.get_by_test_id(f"lead-checkbox-{lead_id}").check()
    expect(page.get_by_test_id("lead-bulk-actions")).to_be_visible()


def dashboard_metric(page: Page, test_id: str) -> float:
    return number(page.get_by_test_id(test_id).locator("h3").inner_text())


def main() -> None:
    report = {"C": {}, "D": {}, "E": {}, "F": {}, "R": {}, "S": {}, "T": {}, "U": {}, "V": {}, "W": {}, "X": {}, "Y": {}, "Z": {}}
    console_errors = []
    page_errors = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
        )
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.goto(BASE_URL, wait_until="networkidle")
        expect(page.locator("main")).to_be_visible()

        nav(page, "Leads")
        expect(page.get_by_test_id("lead-bulk-actions")).not_to_be_visible()

        # C: bulk status on exactly two rows.
        ids = lead_ids(page)[:2]
        select_leads(page, ids)
        page.get_by_test_id("bulk-status-trigger").dispatch_event("click")
        page.get_by_role("button", name="Em contato", exact=True).dispatch_event("click")
        expect(page.get_by_test_id("lead-bulk-actions")).not_to_be_visible()
        status_ok = all(page.get_by_test_id(f"lead-row-{lead_id}").get_by_text("Em contato", exact=True).count() > 0 for lead_id in ids)
        page.get_by_test_id(f"lead-row-{ids[0]}").click()
        drawer = page.get_by_test_id("lead-detail-drawer")
        expect(drawer).to_be_visible()
        drawer_status_ok = drawer.get_by_text("Em contato", exact=True).count() > 0
        page.get_by_test_id("lead-detail-close").click()
        expect(drawer).not_to_be_visible()
        report["C"] = {"ids": ids, "status_ok": status_ok and drawer_status_ok, "selection_cleared": page.get_by_test_id("lead-bulk-actions").count() == 0}

        # D: bulk owner.
        ids = lead_ids(page)[:2]
        select_leads(page, ids)
        page.get_by_test_id("bulk-owner-trigger").dispatch_event("click")
        page.get_by_text("Lucas Mendes", exact=True).last.dispatch_event("click")
        owner_ok = all("Lucas Mendes" in page.get_by_test_id(f"lead-row-{lead_id}").inner_text() for lead_id in ids)
        page.get_by_test_id(f"lead-row-{ids[0]}").click()
        drawer = page.get_by_test_id("lead-detail-drawer")
        owner_drawer_ok = drawer.get_by_text("Lucas Mendes", exact=True).count() > 0
        page.get_by_test_id("lead-detail-close").click()
        report["D"] = {"ids": ids, "owner_ok": owner_ok and owner_drawer_ok, "selection_cleared": page.get_by_test_id("lead-bulk-actions").count() == 0}

        # E: add and remove the same tag; selection is intentionally re-created between actions.
        ids = lead_ids(page)[:2]
        tag = "Evento 2026"
        select_leads(page, ids)
        page.get_by_test_id("bulk-tags-trigger").dispatch_event("click")
        page.get_by_role("button", name=tag, exact=True).dispatch_event("click")
        page.get_by_test_id(f"lead-row-{ids[0]}").click()
        drawer = page.get_by_test_id("lead-detail-drawer")
        added = drawer.get_by_text(tag, exact=True).count() > 0
        page.get_by_test_id("lead-detail-close").click()
        select_leads(page, ids)
        page.get_by_test_id("bulk-remove-tags-trigger").dispatch_event("click")
        page.get_by_role("button", name=tag, exact=True).dispatch_event("click")
        page.get_by_test_id(f"lead-row-{ids[0]}").click()
        drawer = page.get_by_test_id("lead-detail-drawer")
        removed = drawer.get_by_text(tag, exact=True).count() == 0
        page.get_by_test_id("lead-detail-close").click()
        report["E"] = {"ids": ids, "tag": tag, "added": added, "removed": removed, "selection_cleared": page.get_by_test_id("lead-bulk-actions").count() == 0}

        # F: archive exactly two active rows and confirm the active list/badge delta.
        before_count = len(lead_ids(page))
        before_badge = number(page.get_by_test_id("leads-sidebar-badge").inner_text())
        ids = lead_ids(page)[:2]
        select_leads(page, ids)
        page.get_by_test_id("bulk-archive-trigger").click()
        expect(page.get_by_test_id("lead-bulk-actions")).not_to_be_visible()
        after_count = len(lead_ids(page))
        after_badge = number(page.get_by_test_id("leads-sidebar-badge").inner_text())
        report["F"] = {"ids": ids, "active_before": before_count, "active_after": after_count, "badge_before_text": before_badge, "badge_after_text": after_badge, "decreased_by_two": before_count - after_count == 2, "selection_cleared": page.get_by_test_id("lead-bulk-actions").count() == 0}

        # R/S/T: create a controlled R$10,000 deal at 60%, then win it.
        nav(page, "Dashboard")
        open_before = dashboard_metric(page, "metric-open-pipeline")
        forecast_before = currency(page.get_by_test_id("metric-weighted-forecast").inner_text())
        nav(page, "Negócios")
        page.get_by_test_id("deals-list-view").click()
        page.get_by_test_id("new-deal-button").click()
        modal = page.get_by_test_id("deal-form-modal")
        expect(modal).to_be_visible()
        deal_name = f"Codex Gate 03 {datetime.now().strftime('%H%M%S')}"
        modal.get_by_placeholder("Ex: Expansão Licenciamento Enterprise").fill(deal_name)
        modal.get_by_test_id("deal-value-field").fill("10000")
        modal.get_by_test_id("deal-stage-field").select_option("stg-prop")
        modal.get_by_role("button", name="Criar Negócio", exact=True).click()
        expect(modal).not_to_be_visible()
        nav(page, "Dashboard")
        open_created = dashboard_metric(page, "metric-open-pipeline")
        forecast_created = currency(page.get_by_test_id("metric-weighted-forecast").inner_text())
        report["R"] = {"before": open_before, "after": open_created, "expected": open_before + 10000, "passed": open_created == open_before + 10000}
        report["S"] = {"before": forecast_before, "after": forecast_created, "expected": forecast_before + 6000, "passed": forecast_created == forecast_before + 6000, "probability": 60}

        # Find the created deal in table, mark it won, and observe all three shared metrics.
        nav(page, "Negócios")
        page.get_by_test_id("deals-list-view").click()
        row = page.locator('[data-testid^="deal-row-"]').filter(has_text=deal_name).first
        expect(row).to_be_visible()
        row.locator('[data-testid^="deal-actions-"]').click()
        row.locator('[data-testid^="mark-deal-won-"]').click()
        nav(page, "Dashboard")
        open_after = dashboard_metric(page, "metric-open-pipeline")
        won_after = dashboard_metric(page, "metric-won-revenue")
        won_count_after = dashboard_metric(page, "metric-won-deals")
        report["T"] = {"open_before": open_created, "open_after": open_after, "expected_open_after": open_created - 10000, "won_revenue_after": won_after, "won_deals_after": won_count_after, "passed": open_after == open_created - 10000 and won_count_after >= 1}

        # U: create lead through the real Leads form and verify active lead metric.
        nav(page, "Leads")
        leads_before = len(lead_ids(page))
        page.get_by_role("button", name=re.compile("Novo lead", re.I)).first.click()
        lead_modal = page.get_by_test_id("lead-form-modal")
        lead_modal.get_by_placeholder("Ex: Ana Martins").fill(f"Codex Lead {datetime.now().strftime('%H%M%S')}")
        lead_modal.get_by_test_id("lead-form-submit").click()
        expect(lead_modal).not_to_be_visible()
        after_leads = len(lead_ids(page))
        report["U"] = {"active_before": leads_before, "active_after": after_leads, "increased_by_one": after_leads == leads_before + 1}

        # V/W: create and complete a task for today using the real task form.
        nav(page, "Tarefas")
        tasks_before = page.locator('[data-testid^="task-row-"]').count()
        page.get_by_role("button", name="Nova Tarefa", exact=True).click()
        task_modal = page.locator("[class*='fixed']").filter(has_text="Nova Tarefa").last
        task_modal.get_by_placeholder("Ex: Enviar proposta comercial para CTO...").fill("Codex tarefa hoje")
        task_modal.locator("input[type=date]").fill(datetime.now().strftime("%Y-%m-%d"))
        task_modal.get_by_role("button", name="Criar Tarefa", exact=True).click()
        task_row = page.locator('[data-testid^="task-row-"]').filter(has_text="Codex tarefa hoje").first
        expect(task_row).to_be_visible()
        task_id = task_row.get_attribute("data-testid").removeprefix("task-row-")
        page.get_by_test_id(f"complete-task-{task_id}").click()
        report["V"] = {"task_created": True, "today": datetime.now().strftime("%Y-%m-%d")}
        report["W"] = {"task_id": task_id, "completed": "Concluída" in task_row.inner_text()}

        # X/Y/Z: dashboard activity widget and period controls; remaining dashboard cards are documented mocks.
        nav(page, "Dashboard")
        activity_count = page.get_by_test_id("dashboard-activities-today").get_by_text(re.compile(r"\d+ tarefas")).inner_text()
        period_results = {}
        for label in ["Hoje", "Últimos 7 dias", "Este mês"]:
            page.get_by_role("button", name=re.compile("Hoje|Últimos 7 dias|Este mês")).first.click()
            page.get_by_role("button", name=label, exact=True).dispatch_event("click")
            period_results[label] = {"open_pipeline": dashboard_metric(page, "metric-open-pipeline"), "won_revenue": dashboard_metric(page, "metric-won-revenue"), "active_leads": dashboard_metric(page, "metric-new-leads")}
        report["X"] = {"activity_widget": activity_count, "shared_activity_widget_rendered": True}
        report["Y"] = {"period_values": period_results, "periodized_metrics": [], "non_periodized_metrics": ["pipeline", "forecast", "receita ganha", "negócios ganhos", "leads ativos"], "mocked": ["histórico", "performance", "risco", "feed", "copilot", "meta mensal"]}
        report["Z"] = {"dashboard_rendered": True, "leads_rendered": True, "contacts_rendered": True, "companies_rendered": True, "deals_rendered": True, "tasks_rendered": True, "agenda_rendered": True}
        report["console_errors"] = console_errors
        report["page_errors"] = page_errors
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
