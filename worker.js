// Cloudflare Worker: keeps the Gemini key off GitHub Pages.
// In the Worker settings, add a secret named GEMINI_KEY with your key from Google AI Studio.

const MODEL = "gemini-2.5-flash"; // check AI Studio's model list for the current Flash model

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*", // change to "https://YOURNAME.github.io" once it works
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    let prompt;
    try {
      ({ prompt } = await req.json());
    } catch (e) {
      return new Response("Bad request", { status: 400, headers: cors });
    }
    if (!prompt || prompt.length > 200000) {
      return new Response("Bad request", { status: 400, headers: cors });
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        })
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify(data), {
        status: r.status,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(text, { headers: { ...cors, "Content-Type": "application/json" } });
  }
};
