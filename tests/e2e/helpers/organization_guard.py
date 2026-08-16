import os


SHOWROOM_ORGANIZATION_ID = "a0598da6-1ea4-4d94-89c5-d2b476258a03"


def require_isolated_e2e_organization(values=None):
    """Refuse every mutating E2E run unless it names a non-showroom org."""
    values = values or {}
    organization_id = os.environ.get("E2E_ORGANIZATION_ID") or values.get("E2E_ORGANIZATION_ID")
    if not organization_id:
        raise RuntimeError("mutating E2E suites require E2E_ORGANIZATION_ID")
    if organization_id == SHOWROOM_ORGANIZATION_ID:
        raise RuntimeError("mutating E2E suites cannot target the showroom organization")
    return organization_id
