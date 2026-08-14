import dotenv from "dotenv";
import { getAIProvider } from "../../src/lib/ai/provider";
dotenv.config({ path: ".env.local" });

const results: Record<string, { configured: boolean; passed: boolean; model?: string }> = {};
for (const providerName of ["gemini", "groq"] as const) {
  const keyName = providerName === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY";
  const configured = Boolean(process.env[keyName]); results[providerName] = { configured, passed: false };
  if (!configured) continue;
  process.env.AI_PROVIDER = providerName;
  const provider = await getAIProvider();
  const response = await provider.generateText({ system: "Return only valid JSON with an answer field.", user: "Return JSON with answer equal to provider contract passed.", timeoutMs: 20000 });
  const parsed = JSON.parse(response.text) as { answer?: string }; if (provider.name !== providerName || !parsed.answer) throw new Error(`${providerName} contract failed`);
  results[providerName] = { configured: true, passed: true, model: response.model };
}
console.log(JSON.stringify(results));
