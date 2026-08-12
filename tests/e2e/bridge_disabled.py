from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page()
    page.goto("http://127.0.0.1:3000/dashboard", wait_until="commit")
    page.wait_for_selector("main")
    assert page.evaluate("typeof window.__NEXUS_E2E__") == "undefined"
    print("BRIDGE_DISABLED: PASS")
    browser.close()
