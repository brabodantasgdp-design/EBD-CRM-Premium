import json
import os
import re
import urllib.parse
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
from helpers.organization_guard import require_isolated_e2e_organization

BASE = os.environ.get("E2E_BASE_URL", "https://crmpro-p0llu10nf-gestao-de-sistema.vercel.app").rstrip("/")


def env_values():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    for key in ("E2E_VIEWER_A_EMAIL", "E2E_VIEWER_A_PASSWORD", "E2E_SUSPENDED_A_EMAIL", "E2E_SUSPENDED_A_PASSWORD"):
        if os.environ.get(key):
            values[key] = os.environ[key]
    return values


def login(page, email, password):
    response = page.context.request.post(BASE + "/api/auth/login", form={"email": email, "password": password, "next": "/dashboard"}, headers={"x-vercel-protection-bypass": env_values()["VERCEL_AUTOMATION_BYPASS_SECRET"]}, timeout=60000)
    if response.status < 200 or response.status >= 300:
        raise RuntimeError(f"login failed with status {response.status}")
    page.goto(BASE + "/dashboard", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_url(re.compile(r"/dashboard(/|$)"), timeout=30000)


def api(page, path, method="GET", payload=None):
    return page.evaluate("""async ({path, method, payload}) => {
      const r = await fetch(path, {method, credentials:'include', headers: payload ? {'content-type':'application/json'} : undefined, body: payload ? JSON.stringify(payload) : undefined});
      let body = null; try { body = await r.json(); } catch {}
      return {status:r.status, body};
    }""", {"path": path, "method": method, "payload": payload})


def main():
    values = env_values()
    require_isolated_e2e_organization(values)
    report = {"owner": {}, "viewer": {}, "suspended": {}, "console": [], "pageerrors": [], "network5xx": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
        page = context.new_page()
        page.on("console", lambda m: report["console"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: report["pageerrors"].append(str(e)))
        page.on("response", lambda r: report["network5xx"].append({"url": r.url, "status": r.status}) if r.status >= 500 else None)

        login(page, values["E2E_OWNER_A_EMAIL"], values["E2E_OWNER_A_PASSWORD"])
        owner_orgs = api(page, "/api/organizations")
        report["owner"]["login"] = page.url.endswith("/dashboard") or page.url.endswith("/leads")
        report["owner"]["organizations_status"] = owner_orgs["status"]
        page.goto(BASE + "/leads", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1800)
        expect(page.locator("main")).to_be_visible()
        rows = page.locator('[data-testid^="lead-row-"]')
        before = rows.count()

        name = "Codex UI Lead " + str(os.getpid())
        page.get_by_role("button", name=re.compile("Novo lead", re.I)).first.click()
        modal = page.get_by_test_id("lead-form-modal")
        modal.get_by_placeholder("Ex: Ana Martins").fill(name)
        with page.expect_response(lambda r: r.request.method == "POST" and "/api/commercial/leads" in r.url and r.status < 300, timeout=30000):
            modal.get_by_test_id("lead-form-submit").click()
        expect(page.get_by_text(name, exact=True)).to_be_visible()
        created_row = page.locator('[data-testid^="lead-row-"]').filter(has_text=name).first
        lead_id = created_row.get_attribute("data-testid").replace("lead-row-", "")
        report["owner"]["create"] = True

        edited_name = name + " Updated"
        created_row.get_by_title("Editar Lead").click()
        edit_modal = page.get_by_test_id("lead-form-modal")
        edit_modal.get_by_placeholder("Ex: Ana Martins").fill(edited_name)
        with page.expect_response(lambda r: r.request.method == "PATCH" and f"/api/commercial/leads/{lead_id}" in r.url and r.status < 300, timeout=30000):
            edit_modal.get_by_test_id("lead-form-submit").click()
        page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        report["owner"]["edit_refresh"] = page.get_by_text(edited_name, exact=True).count() == 1

        ids = [item.get_attribute("data-testid").replace("lead-row-", "") for item in page.locator('[data-testid^="lead-row-"]').all() if "Convertido" not in item.inner_text()][:2]
        for item_id in ids:
            page.get_by_test_id(f"lead-checkbox-{item_id}").click()
        page.wait_for_timeout(500)
        page.get_by_test_id("bulk-status-trigger").click()
        with page.expect_response(lambda r: r.request.method == "PATCH" and "/api/commercial/leads/bulk" in r.url, timeout=30000) as bulk_response:
            page.get_by_role("button", name="Em contato", exact=True).click()
        report["owner"]["bulk"] = {"status": bulk_response.value.status, "body": bulk_response.value.json(), "rows_updated": all("Em contato" in page.get_by_test_id(f"lead-row-{item_id}").inner_text() for item_id in ids)}

        created_row = page.get_by_test_id(f"lead-row-{lead_id}")
        created_row.get_by_title("Converter em Oportunidade").click()
        conversion = page.locator("form").last
        inputs = conversion.locator("input")
        for index, text in enumerate(["Codex UI Contact", "Codex UI Company", "Codex UI Deal"]):
            inputs.nth(index).fill(text + " " + str(os.getpid()))
        with page.expect_response(lambda r: r.request.method == "POST" and "/api/commercial/leads/convert" in r.url and r.status < 300, timeout=30000):
            conversion.get_by_role("button", name=re.compile("Converter Lead", re.I)).click()
        page.wait_for_timeout(1200); page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        converted = page.get_by_test_id(f"lead-row-{lead_id}")
        report["owner"]["convert_refresh"] = "Convertido" in converted.inner_text()

        archive_id = next(item for item in [x.get_attribute("data-testid").replace("lead-row-", "") for x in page.locator('[data-testid^="lead-row-"]').all()] if item != lead_id)
        page.get_by_test_id(f"lead-checkbox-{archive_id}").check()
        page.get_by_test_id("bulk-archive-trigger").click()
        page.wait_for_timeout(900); page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(1800)
        report["owner"]["bulk_archive_refresh"] = page.get_by_test_id(f"lead-row-{archive_id}").count() == 0
        report["owner"]["export"] = False
        page.get_by_role("button", name="Exportar", exact=True).first.click()
        with page.expect_download(timeout=30000) as download_info:
            page.get_by_role("button", name=re.compile("Exportar Todos", re.I)).dispatch_event("click")
        report["owner"]["export"] = download_info.value.suggested_filename.endswith(".csv")

        page.set_viewport_size({"width": 390, "height": 844}); page.goto(BASE + "/leads", wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        report["mobile"] = page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        page.set_viewport_size({"width": 1366, "height": 900}); page.goto(BASE + "/leads", wait_until="domcontentloaded"); page.wait_for_timeout(1200)
        report["desktop"] = page.locator('[data-testid^="lead-row-"]').count() > 0

        orgs = owner_orgs.get("body", {}).get("organizations", []) if isinstance(owner_orgs.get("body"), dict) else []
        for role, email_key, password_key in [("viewer", "E2E_VIEWER_A_EMAIL", "E2E_VIEWER_A_PASSWORD"), ("suspended", "E2E_SUSPENDED_A_EMAIL", "E2E_SUSPENDED_A_PASSWORD")]:
            role_context = browser.new_context(viewport={"width": 1366, "height": 900}, extra_http_headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]})
            role_page = role_context.new_page()
            login(role_page, values[email_key], values[password_key])
            role_page.goto(BASE + "/leads", wait_until="domcontentloaded"); role_page.wait_for_timeout(1800)
            role_api = api(role_page, "/api/commercial/leads")
            report[role] = {"route": role_page.url.endswith("/leads"), "new_lead_visible": role_page.get_by_role("button", name=re.compile("Novo lead", re.I)).count() > 0, "edit_controls": role_page.get_by_title("Editar Lead").count(), "bulk_controls": role_page.get_by_test_id("lead-bulk-actions").count(), "api_status": role_api["status"], "role": role_api.get("body", {}).get("role") if isinstance(role_api.get("body"), dict) else None}
            role_context.close()

        report["favicon"] = page.request.get(BASE + "/favicon.ico", headers={"x-vercel-protection-bypass": values["VERCEL_AUTOMATION_BYPASS_SECRET"]}).status == 200
        browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
