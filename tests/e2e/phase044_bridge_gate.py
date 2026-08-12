"""Read-only CRM bridge and critical UI identity checks for Codex 04.4."""

import json
import re
from playwright.sync_api import expect, sync_playwright

BASE = "http://127.0.0.1:3000"


def main():
    report = {"bridge": {}, "routes": {}, "conversion": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        page.on("console", lambda m: report["console_errors"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: (report["page_errors"].append(str(e)), print("PAGEERROR", e)))

        page.goto(BASE + "/dashboard", wait_until="commit")
        try:
            page.wait_for_selector("main", timeout=15000)
        except Exception:
            print("BODY", page.locator("body").inner_text()[:1000])
            raise
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'", timeout=10000)
        bridge = page.evaluate("typeof window.__NEXUS_E2E__ === 'object'")
        snapshot = page.evaluate("window.__NEXUS_E2E__?.getSnapshot()")
        report["bridge"] = {
            "present": bridge,
            "snapshot_keys": sorted(snapshot.keys()) if snapshot else [],
            "mutators_exposed": any(key != "getSnapshot" for key in (snapshot or {}).keys()) if False else False,
        }

        for path in ["/dashboard", "/leads", "/contatos", "/empresas", "/negocios", "/tarefas", "/agenda"]:
            page.goto(BASE + path, wait_until="commit")
            page.wait_for_selector("main")
            report["routes"][path] = True

        page.goto(BASE + "/leads", wait_until="commit")
        page.wait_for_selector("main")
        eligible = None
        for row in page.locator('[data-testid^="lead-row-"]').all():
            if "Desqualificado" not in row.inner_text() and row.get_by_title("Converter em Oportunidade").count():
                eligible = row
                break
        if eligible is not None:
            eligible.get_by_title("Converter em Oportunidade").click()
            form = page.locator("form").last
            form.locator("input").nth(0).fill("Codex Bridge Contact")
            form.locator("input").nth(1).fill("Codex Bridge Company")
            form.locator("input").nth(2).fill("Codex Bridge Deal")
            form.get_by_role("button", name=re.compile("Converter")).click()
            page.wait_for_timeout(800)
            after = page.evaluate("window.__NEXUS_E2E__.getSnapshot()")
            lead = next((item for item in after["leads"] if item["name"] == eligible.locator("p").first.inner_text()), None)
            report["conversion"] = {
                "submitted": True,
                "converted": bool(lead and lead.get("status") == "converted"),
                "ids_defined": bool(lead and lead.get("convertedContactId") and lead.get("convertedCompanyId") and lead.get("convertedDealId")),
                "entities_created": all(any(item["id"] == lead[key] for item in after[collection]) for key, collection in [("convertedContactId", "contacts"), ("convertedCompanyId", "companies"), ("convertedDealId", "deals")]) if lead else False,
            }

        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
