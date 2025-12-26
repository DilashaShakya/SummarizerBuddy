async function embedChunks(openai, chunks){
    const kept = chunks.
    map((text, idx) => ({text: text.trim(), idx}))
    .filter((c)=> c.text.length > 0);

    const inputs = kept.map((c)=> c.text);

    // Process in smaller batches to avoid memory issues (max 50 chunks per batch)
    const batchSize = 50;
    const embeddingsByIndex = new Map();

    for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        const batchKept = kept.slice(i, i + batchSize);
        
        const resp = await openai.embeddings.create({
            model : "text-embedding-3-small",
            input : batch
        });

        // Map embeddings back to original chunk indexes
        resp.data.forEach((item, j) => {
            embeddingsByIndex.set(batchKept[j].idx, item.embedding);
        });
        
        // Small delay between batches to help with memory pressure
        if (i + batchSize < inputs.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

  return embeddingsByIndex; // idx -> embedding
}


function chunkText(text, chunkSize=800, overlap=120){
    const cleaned = text.replace(/\s+/g, " ").trim();
    const chunks = []

    let start = 0

    while (start< cleaned.length){
        const end = Math.min(start + chunkSize, cleaned.length)
        const chunk = cleaned.slice(start, end);
        chunks.push(chunk)
        if (end === cleaned.length) break;
        start = end - overlap
        if (start < 0) start = 0;
    }

    return chunks;

}

async function embedQuery(openai, query){
    const resp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    return resp.data[0].embedding;
}
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

function retrieveTopK(queryEmbedding, storedChunks, topK = 5) {
  // storedChunks: [{ id, text, embedding }]
  const scored = storedChunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = {
  embedChunks,
  chunkText,
  embedQuery,
  cosineSimilarity,
  retrieveTopK
};
