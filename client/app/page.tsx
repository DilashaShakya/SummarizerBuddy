"use client"
import { useState } from "react";

  export default function Home(){
    const [text, setText] = useState<string>("")
    const [mode, setMode] = useState("short")
    const [summary, setSummary] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [role, setRole] = useState ("college student")

    async function handleSummarize() {
      setLoading(true)
      setError("");
      setSummary("");

      try{
        const res = await fetch ("http://localhost:5000/summarize",{
          method:"POST",
          headers:{"Content-Type": "application/json"},
          body: JSON.stringify({text, mode, role}),
          }
        );

        if (!res.ok) throw new Error(`Request Failed: ${res.status}`);
        const data = await res.json()
        setSummary(data.summary || "")
      }
      catch(e){
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
      finally{
        setLoading(false);
      }

      
    }

    return (
      <main className="min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl p-8 space-y-6 ">
        <h1 className=" text-3xl font-bold text-center"> Summarizer</h1>

        <div className="flex items-center gap-2"> 
          <label className="font-medium"> 
            Mode{" "}
            <select value={mode} onChange={(e)=> setMode(e.target.value)} className="border border-gray-300 rounded-xl p-1.5 ml-2" >
              <option value='short'>Short</option>
              <option value='detailed'>Detailed</option>
              <option value='bullets'>Bullets</option> 
            </select>
          </label>
          <label className="font-medium">
            <select value={role} onChange={(e)=> setRole(e.target.value)} className="border border-gray-300 rounded-xl p-1.5 ml-2" >
              <option value='12 year old'>12 year old</option>
              <option value='college student'>College Student</option>
              <option value='expert'>Expert</option>
            </select>
          </label>
        </div>

        <div className="space-y-4">
          <textarea 
            placeholder="Please input your text here"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 border border-gray-300 rounded resize-none p-3"
          />
          <div className="flex justify-center">
          <button 
            onClick={handleSummarize} 
            disabled={loading}
            className="bg-gray-300 text-black hover:bg-black hover:text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"> 
            {loading ? "Summarizing.." : "Summarize"}
          </button>
          </div>

          {loading && (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 text-center">
              Summarizing
              <span className="dot-1">.</span>
              <span className="dot-2">.</span>
              <span className="dot-3">.</span>
            </div>
          )}

          {error && <p className="text-red-600 text-center font-medium">{error}</p>}

          {summary && (
            <section className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            </section>
          )}
        </div>
        </div>
      </main>
    )
  }

