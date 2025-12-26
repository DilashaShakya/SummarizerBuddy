"use client";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState<string>("");
  const [mode, setMode] = useState("short");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("college student");

  const [docText, setDocText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showAsk, setShowAsk] = useState(false);

  const [lastIngestedHash, setLastIngestedHash] = useState<string>("");

  async function handleSummarize() {
    if (text.length > 200000) {
      setError("Document is too large. Maximum size is 200KB. Please reduce the document size.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const res = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode, role }),
      });

      if (!res.ok) throw new Error(`Request Failed: ${res.status}`);
      const data = await res.json();
      setSummary(data.summary || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function simpleHash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return String(h);
  }

  async function ensureIngested() {
    const doc = docText.trim();
    if (!doc) throw new Error("Paste a document first.");
    
    if (doc.length > 200000) {
      throw new Error("Document is too large. Maximum size is 200KB. Please reduce the document size.");
    }

    const currentHash = simpleHash(doc);
    if (currentHash === lastIngestedHash) return;

    const res = await fetch("http://localhost:5000/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: doc }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok)
      throw new Error(data.error || data.message || "Ingest failed");

    setLastIngestedHash(currentHash);
  }

  async function handleAsk() {
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      await ensureIngested();

      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topK: 4 }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.error || data.message || "Ask failed");

      setAnswer(data.answer ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">Summarizer</h1>

        <div className="flex items-center gap-2">
          <label className="font-medium">
            Mode{" "}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border border-gray-300 rounded-xl p-1.5 ml-2"
            >
              <option value="short">Short</option>
              <option value="detailed">Detailed</option>
              <option value="bullets">Bullets</option>
            </select>
          </label>

          <label className="font-medium">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 rounded-xl p-1.5 ml-2"
            >
              <option value="12 year old">12 year old</option>
              <option value="college student">College Student</option>
              <option value="expert">Expert</option>
            </select>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <textarea
              placeholder="Paste your document here"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDocText(e.target.value);
              }}
              className="w-full h-40 border border-gray-300 rounded resize-none p-3"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {text.length > 0 && (
                <span className={text.length > 200000 ? "text-red-600 font-medium" : ""}>
                  {Math.round(text.length / 1024)}KB / 200KB max
                </span>
              )}
              {text.length === 0 && (
                <span>Maximum document size: 200KB</span>
              )}
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSummarize}
              disabled={loading || text.length > 200000}
              className="bg-gray-300 text-black hover:bg-black hover:text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Summarizing.." : "Summarize"}
            </button>

            <button
              type="button"
              onClick={() => setShowAsk(true)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
              disabled={loading || text.length > 200000}
            >
              Ask a question
            </button>
          </div>

          {/* Ask panel (outside button row) */}
          {showAsk && (
            <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4">
              <label className="text-sm font-medium text-zinc-700">
                Your question
              </label>

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something about the pasted document..."
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleAsk}
                  disabled={loading || question.trim().length === 0}
                  className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Asking..." : "Ask"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAsk(false);
                    setQuestion("");
                    setAnswer("");
                    setError("");
                  }}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Status + outputs */}
          {loading && (
            <div className="mt-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 text-center">
              Working
              <span className="dot-1">.</span>
              <span className="dot-2">.</span>
              <span className="dot-3">.</span>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-center font-medium">{error}</p>
          )}

          {answer && (
            <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Answer</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {answer}
              </p>
            </div>
          )}

          {summary && (
            <section className="mt-2 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
