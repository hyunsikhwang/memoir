/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 2. API: Preview Link Metadata
app.get("/api/preview-link", async (req: express.Request, res: express.Response): Promise<void> => {
  const urlParam = req.query.url as string;

  if (!urlParam) {
    res.status(400).json({ error: "URL is required." });
    return;
  }

  try {
    // Add protocol if missing
    let targetUrl = urlParam.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // 6 second timeout

    const fetchResponse = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      }
    });
    clearTimeout(id);

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();

    // Custom regex extractors
    const extractMeta = (property: string): string => {
      const regexes = [
        new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:${property}|${property})["'][^>]*?content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]*?content=["']([^"']+)["'][^>]*?(?:property|name)=["'](?:og:${property}|${property})["']`, "i")
      ];
      for (const regex of regexes) {
        const match = html.match(regex);
        if (match && match[1]) {
          // Decode HTML entities
          return match[1]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
        }
      }
      return "";
    };

    // Extract page title
    let title = extractMeta("title");
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    }
    if (!title) {
      title = targetUrl;
    }

    // Extract description
    let description = extractMeta("description");

    // Extract image
    let image = extractMeta("image");
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        const origin = new URL(targetUrl).origin;
        if (image.startsWith("/")) {
          image = origin + image;
        } else {
          image = origin + "/" + image;
        }
      } catch (err) {
        // ignore url parser error
      }
    }

    // Extract site name
    let siteName = extractMeta("site_name");
    if (!siteName) {
      try {
        siteName = new URL(targetUrl).hostname.replace("www.", "");
      } catch (err) {
        siteName = "";
      }
    }

    res.json({
      url: targetUrl,
      title,
      description: description || "설명이 없는 웹페이지입니다.",
      image: image || "",
      siteName: siteName || ""
    });
  } catch (error: any) {
    console.error("Error previewing URL:", error);
    // Return graceful partial data even on failure
    try {
      const parsedUrl = new URL(urlParam);
      res.json({
        url: urlParam,
        title: parsedUrl.hostname,
        description: "미리보기를 불러올 수 없는 링크입니다.",
        image: "",
        siteName: parsedUrl.hostname.replace("www.", "")
      });
    } catch (e) {
      res.json({
        url: urlParam,
        title: urlParam,
        description: "올바르지 않은 링크 형식이거나 불러오기에 실패했습니다.",
        image: "",
        siteName: ""
      });
    }
  }
});

// Setup Vite Dev Server / Static Ingress
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite only in development to prevent esbuild bundling issues
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware active.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server active serving:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
