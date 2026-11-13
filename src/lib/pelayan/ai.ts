import { betaRefusalFallbackMiddleware } from "@anthropic-ai/sdk";
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

// Claude melalui Vertex AI dalam project GCP sendiri. Pengesahan guna akaun servis Cloud Run (ADC), tiada kunci API.
export const MODEL_AI = "claude-opus-5-5";

let klien: AnthropicVertex | null = null;
let klienFallback: AnthropicVertex | null = null;

export function aiSedia(): boolean {
  return Boolean(process.env.VERTEX_PROJECT_ID);
}

function bina(fallback: boolean): AnthropicVertex {
  return new AnthropicVertex({
    projectId: process.env.VERTEX_PROJECT_ID,
    region: process.env.VERTEX_REGION || "global",
    ...(fallback ? { middleware: [betaRefusalFallbackMiddleware([{ model: "claude-opus-4-8" }])] } : {}),
  });
}

export function klienAI(): AnthropicVertex {
  return (klien ??= bina(false));
}

// Server-side `fallbacks` tiada di Vertex; middleware ini mengulang permintaan yang ditolak pada model sandaran.
export function klienAIDenganSandaran(): AnthropicVertex {
  return (klienFallback ??= bina(true));
}
