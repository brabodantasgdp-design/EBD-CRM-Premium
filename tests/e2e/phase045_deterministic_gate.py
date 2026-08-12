import json
import re
from playwright.sync_api import expect, sync_playwright

BASE = "http://127.0.0.1:3000"


def snap(page):
    return page.evaluate("window.__NEXUS_E2E__.getSnapshot()")


def main():
    report = {"move_menu": {}, "reopen": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        page.on("console", lambda m: report["console_errors"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: report["page_errors"].append(str(e)))
        page.goto(BASE + "/negocios", wait_until="commit")
        page.wait_for_selector("main")
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'")

        before = snap(page)
        card = page.locator('[data-testid^="kanban-card-"]').first
        deal_id = card.get_attribute("data-deal-id")
        deal_before = next(d for d in before["deals"] if d["id"] == deal_id)
        source = card.locator("xpath=ancestor::*[@data-testid][1]").get_attribute("data-stage-id")
        menu_button = card.locator("button[title]").first
        menu_button.click()
        target_button = page.locator("button").filter(has_text="Proposta").last
        target_button.click()
        after = snap(page)
        deal_after = next(d for d in after["deals"] if d["id"] == deal_id)
        report["move_menu"] = {
            "deal_id": deal_id,
            "before": {"stageId": deal_before.get("stageId"), "stageName": deal_before.get("stageName"), "probability": deal_before.get("probability"), "history": len(deal_before.get("stageHistory") or [])},
            "after": {"stageId": deal_after.get("stageId"), "stageName": deal_after.get("stageName"), "probability": deal_after.get("probability"), "history": len(deal_after.get("stageHistory") or [])},
            "changed": deal_after.get("stageId") != deal_before.get("stageId"),
            "source_stage": source,
            "single_record": sum(d["id"] == deal_id for d in after["deals"]) == 1,
        }

        page.get_by_test_id("deals-list-view").click()
        row = page.locator(f'[data-testid="deal-row-{deal_id}"]')
        row.get_by_test_id(f"deal-actions-{deal_id}").click()
        page.get_by_role("button", name=re.compile("Marcar como Perdido")).click()
        modal = page.get_by_role("button", name="Confirmar Perda", exact=True).locator("xpath=ancestor::div[contains(@class,'fixed')][1]")
        if modal.locator("select").count(): modal.locator("select").first.select_option(index=1)
        page.get_by_role("button", name="Confirmar Perda", exact=True).click()
        lost = snap(page)
        lost_deal = next(d for d in lost["deals"] if d["id"] == deal_id)
        page.get_by_role("button", name="Perdidos", exact=True).click()
        page.locator(f'[data-testid="deal-actions-{deal_id}"]').click()
        page.get_by_role("button", name=re.compile("Reabrir Negócio")).click()
        reopen = page.get_by_role("button", name="Confirmar Reabertura", exact=True).locator("xpath=ancestor::div[contains(@class,'fixed')][1]")
        selects = reopen.locator("select")
        if selects.count() >= 2:
            selects.nth(0).select_option(index=0)
            selects.nth(1).select_option(index=1)
        page.get_by_role("button", name="Confirmar Reabertura", exact=True).click()
        reopened = snap(page)
        reopened_deal = next(d for d in reopened["deals"] if d["id"] == deal_id)
        report["reopen"] = {
            "before": {"status": lost_deal.get("status"), "history": len(lost_deal.get("stageHistory") or [])},
            "after": {"status": reopened_deal.get("status"), "stageId": reopened_deal.get("stageId"), "stageName": reopened_deal.get("stageName"), "probability": reopened_deal.get("probability"), "history": len(reopened_deal.get("stageHistory") or [])},
            "open": reopened_deal.get("status") == "open",
            "history_increased": len(reopened_deal.get("stageHistory") or []) > len(lost_deal.get("stageHistory") or []),
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
