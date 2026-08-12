"""Small read-only helpers for the Nexus CRM E2E bridge."""


def get_crm_snapshot(page):
    return page.evaluate("window.__NEXUS_E2E__?.getSnapshot()")


def dispatch_html5_drag(page, source_selector, target_selector):
    return page.evaluate(
        """({ sourceSelector, targetSelector }) => {
          const source = document.querySelector(sourceSelector);
          const target = document.querySelector(targetSelector);
          if (!source || !target) return false;
          const transfer = new DataTransfer();
          for (const [element, type] of [[source, 'dragstart'], [target, 'dragenter'], [target, 'dragover'], [target, 'drop'], [source, 'dragend']]) {
            element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
          }
          return true;
        }""",
        {"sourceSelector": source_selector, "targetSelector": target_selector},
    )
