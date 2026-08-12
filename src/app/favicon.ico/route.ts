const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#111827"/>
  <path d="M18 18h10v28H18zM36 18h10v28H36z" fill="#38bdf8"/>
  <path d="M28 28h8v8h-8z" fill="#f8fafc"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": "image/svg+xml",
    },
  });
}
