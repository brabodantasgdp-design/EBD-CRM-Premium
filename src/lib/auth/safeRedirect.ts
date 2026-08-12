const fallbackPath = "/dashboard";

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallbackPath;
  try {
    const target = new URL(value, "http://nexus.local");
    if (target.origin !== "http://nexus.local") return fallbackPath;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallbackPath;
  }
}
