export type AIProviderName = "gemini" | "mock";
export type AIRequest = { system: string; user: string; timeoutMs?: number };
export type AIResponse = { text: string; inputTokens?: number; outputTokens?: number; provider: AIProviderName; model: string };

export interface AIProvider { name: AIProviderName; model: string; generateText(request: AIRequest): Promise<AIResponse>; }

export function aiProviderConfigured() { return Boolean(process.env.GEMINI_API_KEY); }

export async function getAIProvider(): Promise<AIProvider> {
  const provider = process.env.AI_PROVIDER || "gemini";
  if (provider === "mock") return new MockProvider();
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    const { GoogleGenAI } = await import("@google/genai");
    return new GeminiProvider(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) as unknown as GeminiClient, process.env.AI_MODEL || "gemini-2.0-flash");
  }
  throw new Error("ai_provider_not_configured");
}

type GeminiClient = { models: { generateContent(input: { model: string; contents: string; config: Record<string, unknown> }): Promise<{ text?: string; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }> } };
class GeminiProvider implements AIProvider {
  name: AIProviderName = "gemini";
  constructor(private readonly client: GeminiClient, public readonly model: string) {}
  async generateText(request: AIRequest): Promise<AIResponse> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 20000);
    try {
      const response = await this.client.models.generateContent({ model: this.model, contents: request.user, config: { systemInstruction: request.system, temperature: 0.2, responseMimeType: "application/json", abortSignal: controller.signal } });
      return { text: response.text || "{}", provider: this.name, model: this.model, inputTokens: response.usageMetadata?.promptTokenCount, outputTokens: response.usageMetadata?.candidatesTokenCount };
    } finally { clearTimeout(timeout); }
  }
}

class MockProvider implements AIProvider {
  name: AIProviderName = "mock"; model = "contract-test";
  async generateText(): Promise<AIResponse> { return { text: JSON.stringify({ facts: [], suggestions: ["Não há provider real configurado para esta resposta."], risks: [], nextSteps: [], answer: "Provider de contrato: nenhuma análise real foi executada." }), provider: this.name, model: this.model }; }
}
