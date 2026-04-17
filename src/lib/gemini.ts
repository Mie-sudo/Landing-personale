import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export type ImageSize = "1K" | "2K" | "4K";
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";

export interface GenerateImageOptions {
  prompt: string;
  size?: ImageSize;
  aspectRatio?: AspectRatio;
  referenceImage?: string; // Base64 string (including data prefix or just the content)
}

export async function generateWallpaperVariation({
  prompt,
  size = "1K",
  aspectRatio = "9:16",
  referenceImage,
}: GenerateImageOptions): Promise<string> {
  const model = "gemini-3-pro-image-preview";
  
  const contents: any[] = [];
  
  // If we have a reference image, add it as a part
  if (referenceImage) {
    const [mimeInfo, base64Data] = referenceImage.split(';base64,');
    const mimeType = mimeInfo.split(':')[1] || 'image/png';
    contents.push({
      inlineData: {
        data: base64Data || referenceImage, // fallback if user forgot prefix
        mimeType: mimeType
      }
    });
    // Add "Inspired by this image" context
    contents.push({ text: `Create a new variation of this image with the following vibe: ${prompt}. Maintain the core composition but explore a slightly different artistic interpretation.` });
  } else {
    contents.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any,
      },
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate) throw new Error("No candidate found in response.");

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data found in response.");
}

// Helper to generate 4 variations in parallel
export async function generateWallpaperBatch(options: GenerateImageOptions): Promise<string[]> {
  const promises = Array(4).fill(null).map(() => generateWallpaperVariation(options));
  return Promise.all(promises);
}
