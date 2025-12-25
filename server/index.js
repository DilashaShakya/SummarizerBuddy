const express = require('express');
const cors = require("cors");

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json())

app.get("/", (req, res)=>{
    res.send("Server is running");
})

app.post ("/summarize", (req, res)=>{
    const {text, mode} = req.body;

    const preview = (text || "").slice(0,120);

    res.json({
        summary: `Mode=${mode || "short"} | Dummy summary: ${preview}${preview.length === 120 ? "..." : ""}`,
  });
}) 

app.listen(5000, "0.0.0.0", () => {
  console.log("Server listening on http://localhost:5000");
});
