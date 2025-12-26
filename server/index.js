require("dotenv/config");
const OpenAI = require("openai");

const express = require('express');
const cors = require("cors");

const app = express();

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
    const { text, mode } = req.body;

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
        kid: "Explain in very simple language, using short sentences and no technical jargon.",
        student: "Explain clearly for a college student with basic background knowledge.",
        expert: "Explain concisely using precise technical language and correct terminology.",
    };

    const prompt = `
        ${instructionsByMode[mode] || instructionsByMode.short}
        ${audienceInstructions[audience] || audienceInstructions.student}

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

app.listen(5000, "0.0.0.0", () => {
  console.log("Server listening on http://localhost:5000");
});
