import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def load_env():
    values = {}
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


env = load_env()
email = env["E2E_OWNER_A_EMAIL"]
password = env["E2E_OWNER_A_PASSWORD"]
supabase = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
key = env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
preview = "https://crmpro-jaihtq93v-gestao-de-sistema.vercel.app"
result = {}

def post(url, headers, body):
    request = Request(url, data=json.dumps(body).encode(), headers={**headers, "Content-Type": "application/json"}, method="POST")
    try:
        response = urlopen(request, timeout=30)
        return response.status, dict(response.headers), response.read()
    except HTTPError as error:
        return error.code, dict(error.headers), error.read()


status, headers, body = post(supabase + "/auth/v1/token?grant_type=password", {"apikey": key}, {"email": email, "password": password})
result["supabase_status"] = status
result["supabase_ok"] = 200 <= status < 300
result["supabase_error"] = json.loads(body).get("error_description") if not result["supabase_ok"] else None

status, headers, body = post(preview + "/api/auth/login", {"x-vercel-protection-bypass": env.get("VERCEL_AUTOMATION_BYPASS_SECRET", "")}, {"email": email, "password": password, "next": ""})
set_cookie = headers.get("set-cookie", "")
result["preview_status"] = status
result["preview_ok"] = 200 <= status < 300
try:
    result["preview_error"] = json.loads(body).get("error") if status >= 400 else None
except json.JSONDecodeError:
    result["preview_error"] = "non_json_response"
result["set_cookie_present"] = bool(set_cookie)
result["set_cookie_names"] = [part.split("=", 1)[0] for part in set_cookie.split(",") if "=" in part][:10]
print(json.dumps(result, ensure_ascii=True))
