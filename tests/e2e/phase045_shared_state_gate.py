import json
import re
from playwright.sync_api import sync_playwright

from helpers.crm_bridge import get_crm_snapshot

BASE = "http://127.0.0.1:3000"


def main():
    report = {"task": {}, "activity": {}, "console_errors": [], "page_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        page.on("console", lambda m: report["console_errors"].append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: report["page_errors"].append(str(e)))
        page.goto(BASE + "/negocios", wait_until="commit")
        page.wait_for_selector("main")
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'")

        card = page.locator('[data-testid^="kanban-card-"]').first
        deal_id = card.get_attribute("data-deal-id")
        card.locator("button").first.click()
        page.get_by_role("button", name=re.compile(r"^Tarefas \(")).click()
        task_title = "E2E tarefa compartilhada"
        page.get_by_placeholder("Título da tarefa (ex: Enviar proposta de contrato atualizada)").fill(task_title)
        page.get_by_role("button", name="Adicionar Tarefa", exact=True).click()
        task = next(t for t in get_crm_snapshot(page)["tasks"] if t["title"] == task_title)
        task_id = task["id"]
        page.locator("div.fixed.inset-0.z-50 button").first.click()
        page.locator('a[href="/tarefas"]').first.click()
        page.wait_for_selector("main")
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'")
        page.wait_for_url("**/tarefas")
        listed_task = page.locator(f'[data-task-id="{task_id}"]')
        listed_task.wait_for()
        page.get_by_test_id(f"complete-task-{task_id}").click()
        completed = next(t for t in get_crm_snapshot(page)["tasks"] if t["id"] == task_id)
        report["task"] = {"id": task_id, "deal_id": deal_id, "listed": listed_task.count() == 1, "completed": completed["status"] == "completed", "single_record": sum(t["id"] == task_id for t in get_crm_snapshot(page)["tasks"]) == 1}

        page.locator('a[href="/negocios"]').first.click()
        page.wait_for_url("**/negocios")
        page.wait_for_selector("main")
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'")
        page.locator(f'[data-testid="kanban-card-{deal_id}"] button').first.click()
        page.get_by_role("button", name=re.compile(r"^Tarefas \(")).click()
        page.locator(f'[data-task-id="{task_id}"]').wait_for()
        page.get_by_role("button", name=re.compile(r"^Atividades \(")).click()
        activity_title = "E2E atividade compartilhada"
        page.get_by_placeholder("Título da atividade (ex: Reunião de alinhamento com CTO)").fill(activity_title)
        page.get_by_role("button", name="Registrar Atividade", exact=True).click()
        activity = next(a for a in get_crm_snapshot(page)["activities"] if a["title"] == activity_title)
        activity_id = activity["id"]
        page.locator("div.fixed.inset-0.z-50 button").first.click()
        page.locator('a[href="/agenda"]').first.click()
        page.wait_for_url("**/agenda")
        page.wait_for_selector("main")
        page.wait_for_function("typeof window.__NEXUS_E2E__ === 'object'")
        agenda_item = page.locator(f'[data-activity-id="{activity_id}"]')
        report["activity"] = {"id": activity_id, "deal_id": deal_id, "listed_in_agenda": agenda_item.count() == 1, "single_record": sum(a["id"] == activity_id for a in get_crm_snapshot(page)["activities"]) == 1}
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()


if __name__ == "__main__":
    main()
