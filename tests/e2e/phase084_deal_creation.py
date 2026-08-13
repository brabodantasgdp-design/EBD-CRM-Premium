import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")


def load_env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    values.update({k: v for k, v in os.environ.items() if k.startswith("E2E_") or k == "VERCEL_AUTOMATION_BYPASS_SECRET"})
    return values


def first_option(select):
    values = select.locator("option").evaluate_all("items => items.map(item => item.value).filter(Boolean)")
    return values[0] if values else None


def test_create_deal_ui_persists_real_record():
    env = load_env()
    report = {"post_status": None, "created_visible": False, "refresh_visible": False, "errors": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            viewport={"width": 1366, "height": 900},
            extra_http_headers={"x-vercel-protection-bypass": env.get("VERCEL_AUTOMATION_BYPASS_SECRET", "")},
        )
        page = context.new_page()
        page.on("pageerror", lambda error: report["errors"].append(str(error)))
        page.goto(BASE + "/login", wait_until="domcontentloaded", timeout=60000)
        page.get_by_label("E-mail").fill(env["E2E_OWNER_A_EMAIL"])
        page.get_by_label("Senha").fill(env["E2E_OWNER_A_PASSWORD"])
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/dashboard", timeout=60000)
        page.goto(BASE + "/negocios", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1200)
        page.get_by_test_id("new-deal-button").click()
        modal = page.get_by_test_id("deal-form-modal")
        deal_name = "Codex 08.4 UI Regression"
        modal.locator("input[type=text]").first.fill(deal_name)
        modal.get_by_test_id("deal-value-field").fill("12345")
        selects = modal.locator("select")
        for index in range(min(selects.count(), 4)):
            option = first_option(selects.nth(index))
            if option:
                selects.nth(index).select_option(option)
        with page.expect_response(lambda response: response.request.method == "POST" and "/api/commercial/deals" in response.url, timeout=30000) as response_info:
            modal.get_by_role("button", name="Criar Negócio", exact=True).click()
        report["post_status"] = response_info.value.status
        page.wait_for_timeout(1200)
        report["created_visible"] = page.get_by_text(deal_name, exact=True).count() > 0
        page.reload(wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1200)
        report["refresh_visible"] = page.get_by_text(deal_name, exact=True).count() > 0
        browser.close()
    print(json.dumps(report, ensure_ascii=True))
    assert report["post_status"] is not None and 200 <= report["post_status"] < 300
    assert report["created_visible"]
    assert report["refresh_visible"]


if __name__ == "__main__":
    test_create_deal_ui_persists_real_record()
