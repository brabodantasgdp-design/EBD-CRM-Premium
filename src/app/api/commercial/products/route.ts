import { NextResponse } from "next/server";
import { createProduct, listProducts } from "../../../../lib/crm/products";
import type { ProductInput } from "../../../../lib/crm/products";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";

export async function GET(request: Request) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const url = new URL(request.url);
  try { return NextResponse.json({ products: await listProducts(supabase, organization.id, url.searchParams.get("q") ?? undefined, url.searchParams.get("status") ?? undefined) }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar produtos" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try { return NextResponse.json({ product: await createProduct(supabase, organization.id, body as ProductInput) }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Não foi possível criar produto" }, { status: 400 }); }
}
