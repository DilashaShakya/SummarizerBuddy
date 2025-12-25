"use client"
import { useState } from "react";

  export default function Home(){
    const [text, setText] = useState<string>("")
    const [mode, setMode] = useState("short")
    const [summary, setSummary] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSummarize() {
      setLoading(true)
      setError("");
      setSummary("");

      try{
        const res = await fetch ("http://localhost:5000/summarize",{
          method:"POST",
          headers:{"Content-Type": "application/json"},
          body: JSON.stringify({text, mode}),
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
      <main>
        <h1> Summarizer</h1>

        <div> 
          <label> 
            Mode{" "}
            <select value={mode} onChange={(e)=> setMode(e.target.value)} >
              <option value='short'> Short</option>
              <option value='detailed'> Detailed</option>
              <option value='bullets'> Bullets</option> 
            </select>
          </label>
        </div>

        <div>
          <textarea 
            placeholder="Please input your text here"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={handleSummarize}> 
            {loading ? "Summarizing.." : "Summarize"}
          </button>

          {error && <p>{error}</p>}

          {summary && (
            <section>
            <h1> Summary</h1>
            <p> {summary}</p>
            </section>
          )}
        </div>
      </main>
    )
  }

