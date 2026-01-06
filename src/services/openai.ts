import OpenAI from "openai";
import { toFile } from "openai";

let openai: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set. Create a .env file with your key.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

export const transcribeAudio = async (audioPath: string): Promise<string> => {
  const audioFile = Bun.file(audioPath);
  const arrayBuffer = await audioFile.arrayBuffer();
  
  const file = await toFile(new Uint8Array(arrayBuffer), "audio.wav", {
    type: "audio/wav",
  });
  
  const transcription = await getClient().audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  
  return transcription.text;
};

export const formatWithGPT = async (rawText: string): Promise<string> => {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that formats daily activity notes.
Given raw, unstructured notes about what someone did today, format them into clean, concise bullet points.
Each bullet point should be a complete thought.
Remove filler words, hesitations, and repetitions.
Keep the original meaning and details intact.
IMPORTANT: Keep the text in its original language. Do NOT translate.
Output ONLY the bullet points, nothing else. Each bullet point should start with "- ".`,
      },
      {
        role: "user",
        content: rawText,
      },
    ],
    temperature: 0.3,
  });
  
  return response.choices[0]?.message?.content || rawText;
};

