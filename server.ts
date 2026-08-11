import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini (handling missing API key gracefully to prevent crash)
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("GEMINI_API_KEY not configured or has default value. AI features will be disabled.");
  }

  // API Route for Gemini
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!ai) {
        return res.status(503).json({ 
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets." 
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const isRateLimit = 
        error?.code === 429 || 
        error?.error?.code === 429 ||
        (error?.status && error.status.toString().toLowerCase().includes("resource_exhausted")) ||
        (error?.message && (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("resource_exhausted")));

      if (isRateLimit) {
        return res.status(429).json({ 
          error: "Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). Please wait a few moments before retrying.",
          isRateLimited: true
        });
      }

      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Helper for fallback documentation links when search grounding is rate limited
  function getFallbackGroundingLinks(query: string) {
    const q = query.toLowerCase();
    const links: { title: string; uri: string }[] = [];

    if (q.includes("vite") || q.includes("react")) {
      links.push({ title: "Vite Official Documentation", uri: "https://vite.dev/guide/" });
      links.push({ title: "React Official Documentation", uri: "https://react.dev/reference/react" });
    }
    if (q.includes("firebase") || q.includes("firestore")) {
      links.push({ title: "Firebase Firestore Documentation", uri: "https://firebase.google.com/docs/firestore" });
      links.push({ title: "Firebase Authentication Docs", uri: "https://firebase.google.com/docs/auth" });
    }
    if (q.includes("gemini") || q.includes("google genai") || q.includes("ai")) {
      links.push({ title: "Google Gemini API Documentation", uri: "https://ai.google.dev/gemini-api/docs" });
      links.push({ title: "Google GenAI SDK TypeScript Reference", uri: "https://ai.google.dev/gemini-api/docs/quickstart?lang=node" });
    }
    if (q.includes("n8n") || q.includes("automation") || q.includes("webhook")) {
      links.push({ title: "n8n Automation Documentation", uri: "https://docs.n8n.io/" });
      links.push({ title: "n8n Webhook Node Reference", uri: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" });
    }
    if (q.includes("tailwind") || q.includes("css")) {
      links.push({ title: "Tailwind CSS v4 Documentation", uri: "https://tailwindcss.com/docs" });
    }

    if (links.length === 0) {
      links.push({ title: `Google Search for "${query}"`, uri: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
      links.push({ title: "Google Developers Documentation", uri: "https://developers.google.com/" });
      links.push({ title: "MDN Web Docs Reference", uri: "https://developer.mozilla.org/" });
    }

    return links;
  }

  // API Route for Google Search Grounding and Link Fixer
  app.post("/api/gemini/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      if (!ai) {
        return res.status(503).json({ 
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets." 
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract search grounding metadata
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const webSearchQueries = groundingMetadata?.webSearchQueries || [];

      const rawLinks = groundingChunks
        .map((chunk: any) => {
          if (chunk.web) {
            return {
              title: chunk.web.title || "Reference Link",
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter((item: any) => item !== null && item.uri);

      // Deduplicate links by URI
      const searchLinks: { title: string; uri: string }[] = [];
      const seenUris = new Set<string>();
      for (const link of rawLinks) {
        if (!seenUris.has(link.uri)) {
          seenUris.add(link.uri);
          searchLinks.push(link);
        }
      }

      res.json({
        text: response.text,
        links: searchLinks,
        queries: webSearchQueries,
      });
    } catch (error: any) {
      console.error("Gemini Search Error:", error);

      const isRateLimit = 
        error?.code === 429 || 
        error?.error?.code === 429 ||
        (error?.status && error.status.toString().toLowerCase().includes("resource_exhausted")) ||
        (error?.message && (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("resource_exhausted")));

      if (isRateLimit) {
        console.warn("Gemini Search Rate Limit hit (429 RESOURCE_EXHAUSTED). Returning fallback grounded links.");
        const fallbackLinks = getFallbackGroundingLinks(req.body?.query || "");
        return res.json({
          text: `⚠️ **Notice**: Gemini Search Grounding API rate limit reached (429 RESOURCE_EXHAUSTED). Providing fallback verified reference links for query: "${req.body?.query || ""}"`,
          links: fallbackLinks,
          queries: [req.body?.query || "docs"],
          isRateLimited: true,
        });
      }

      res.status(500).json({ error: error.message || "Failed to execute search" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
