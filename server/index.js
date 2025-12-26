require("dotenv/config");
const OpenAI = require("openai");

const express = require('express');
const cors = require("cors");
const { chunkText, embedChunks, embedQuery, cosineSimilarity } = require("./utils/embeddings");

const app = express();

const store = {
    chunks: [],
};

// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables!");
  console.error("Please create a .env file in the server directory with: OPENAI_API_KEY=your_api_key_here");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json())

app.get("/", (req, res)=>{
    res.send("Server is running");
})

app.post("/summarize", async (req, res) => {
  try {
    const { text, mode, role } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ summary: "No text provided." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ summary: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file." });
    }

    const instructionsByMode = {
      short: "Write a concise 2-3 sentence summary.",
      bullets: "Write 5 bullet points summarizing the key ideas.",
      detailed: "Write a detailed summary with headings if helpful.",
    };

    const audienceInstructions = {
        "12 year old": "Explain in very simple language, using short sentences and no technical jargon.",
        "college student": "Explain clearly for a college student with basic background knowledge.",
        "expert": "Explain concisely using precise technical language and correct terminology.",
    };

    const prompt = `
        ${instructionsByMode[mode] || instructionsByMode.short}
        ${audienceInstructions[role] || audienceInstructions["college student"]}

Text:
${text}
`;


    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful summarization assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const summary = result.choices?.[0]?.message?.content?.trim() || "";
    res.json({ summary });
  } catch (err) {
    console.error("Error details:", err);
    const errorMessage = err.message || "Unknown error occurred";
    res.status(500).json({ 
      summary: `Server error: ${errorMessage}. Please check your OpenAI API key and try again.` 
    });
  }
});

app.post("/summarize-focused", async (req, res) => {
  try {
    const { focus, mode = "short", topK = 4 } = req.body;

    if (!focus || typeof focus !== "string") {
      return res.status(400).json({ ok: false, message: "No focus provided." });
    }

    if (!store.chunks.length) {
      return res.status(400).json({ ok: false, message: "No document ingested yet. Call /ingest first." });
    }

    // 1) Embed the focus query
    const qEmbedding = await embedQuery(openai, focus);

    // 2) Retrieve relevant chunks
    const scored = store.chunks
      .map((c) => ({ ...c, score: cosineSimilarity(qEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(topK, 8)));

    const context = scored.map((c, i) => `Source ${i + 1}:\n${c.text}`).join("\n\n");

    // 3) Summarize ONLY retrieved context
    const instructionsByMode = {
      short: "Write a concise 2-3 sentence summary.",
      bullets: "Write 5 bullet points summarizing the key ideas.",
      detailed: "Write a detailed summary with headings if helpful.",
    };

    const result = await openai.chat.completions.create({
        model:"gpt-4o-mini",
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: "Summarize ONLY from provided sources. If the sources don't mention the focus, say that it wasn't found."
            },
            {
          role: "user",
          content: `${instructionsByMode[mode] || instructionsByMode.short}

Focus topic: ${focus}

SOURCES:
${context}`,
        },
      ],
    });

    const summary = result.choices?.[0]?.message?.content?.trim() || "";

    res.json({
      ok: true,
      summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Focused summarization failed." });
  }
});

app.post("/ask", async (req, res)=>{
    try{
        const {question, topK = 4} = req.body

        if (!question || typeof question!== "string"){
            return res.status(400).json({ok: false, error: "No question provided"});
        }

        if (!store.chunks?.length){
            return res.status(400).json({ok:false, error: "No document ingested yet!"})
        }

        // 1) Embed the question
    const qEmbedding = await embedQuery(openai, question);

    // 2) Score each stored chunk against the question
    const k = Math.max(1, Math.min(Number(topK) || 4, 8));
    const scored = store.chunks
      .map((c) => ({ ...c, score: cosineSimilarity(qEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    // 3) Build context from top-k chunks
    const context = scored
      .map((c, i) => `SOURCE ${i + 1}:\n${c.text}`)
      .join("\n\n---\n\n");

    // 4) Ask the model using ONLY retrieved context
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Answer using ONLY the provided sources. If the answer isn't in the sources, say you don't know.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nSOURCES:\n${context}`,
        },
      ],
    });

    const answer = result.choices?.[0]?.message?.content?.trim() || "";

    return res.json({
      ok: true,
      answer
    });
  } catch (err) {
    console.error("ask error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Ask failed." });
  }
});

// embedding into memory
app.post ("/ingest", async(req, res)=>{
    try {
        const {text} = req.body 
        if (!text || typeof text !== "string"){
            return res.status(400).json({ok:false, message: "No text provided."})
        }
        
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ok: false, message: "OpenAI API key is not configured."});
        }

        // Limit document size to prevent memory issues (max 200KB)
        if (text.length > 200000) {
            return res.status(400).json({ok: false, message: "Document too large. Maximum size is 200KB."});
        }

        // Clear old chunks first to free memory
        const oldChunks = store.chunks;
        store.chunks = [];
        
        // Explicitly clear references
        if (oldChunks && oldChunks.length > 0) {
            oldChunks.forEach(chunk => {
                if (chunk && chunk.embedding) {
                    chunk.embedding = null;
                }
            });
        }
        
        // Force garbage collection hint
        if (global.gc) {
            global.gc();
        }

        // Use larger chunks to reduce total number (1200 chars, 200 overlap)
        const chunks = chunkText(text, 1200, 200);
        
        // Limit number of chunks to prevent memory overflow (max 200 chunks)
        if (chunks.length > 200) {
            return res.status(400).json({ok: false, message: `Document too large. Generated ${chunks.length} chunks, maximum is 200. Please use a shorter document (max 200KB).`});
        }

        const embeddingsByIndex = await embedChunks(openai, chunks);

        // building the chunks to store
        store.chunks = chunks.map((chunkText, idx)=>{
            const embedding = embeddingsByIndex.get(idx);
            if (!embedding) return null;
            return {id:idx, text:chunkText, embedding};
        })
        .filter(Boolean);
        
        return res.json({ ok: true, chunkCount: store.chunks.length });
    } catch (err) {
        console.error("ingest error:", err);
        // Clear store on error to free memory
        store.chunks = [];
        return res.status(500).json({ 
            ok: false, 
            message: err?.message || "Failed to ingest document. Please check your API key and try again." 
        });
    }
})

app.listen(5000, "0.0.0.0", () => {
  console.log("Server listening on http://localhost:5000");
});
