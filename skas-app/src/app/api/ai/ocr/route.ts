import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageBase64, mimeType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType ?? "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Anda adalah sistem OCR untuk sijil pencapaian sekolah Malaysia dalam konteks SK@S (School Quality Management System).

Ekstrak maklumat berikut daripada sijil ini dan balas dalam format JSON sahaja (tanpa markdown):
{
  "programName": "nama program/pertandingan",
  "achievementDate": "YYYY-MM-DD",
  "level": "district|state|national|international",
  "teacherRole": "peserta|jurulatih|penganjur|fasilitator|hakim",
  "participantName": "nama peserta jika ada",
  "position": "kedudukan/anugerah jika ada",
  "confidence": 0.0-1.0
}

Jika mana-mana maklumat tidak jelas atau tiada dalam sijil, gunakan null untuk nilai tersebut.`,
          },
        ],
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
  }

  try {
    const extracted = JSON.parse(textContent.text);
    return NextResponse.json(extracted);
  } catch {
    return NextResponse.json({ raw: textContent.text }, { status: 200 });
  }
}
