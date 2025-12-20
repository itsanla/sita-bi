const ML_SERVICE_URL = process.env.ML_SIMILARITY_URL || 'http://localhost:3003';
const REQUEST_TIMEOUT = 30000; // 30s for large batches

function cosineSimilarity(v1: number[], v2: number[]): number {
  // Dot product only (vectors already normalized by TEI)
  return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}

export async function calculateSimilarities(
  newTitle: string,
  existingTitles: { id: number; judul: string }[],
): Promise<{ id: number; judul: string; similarity: number }[]> {
  try {
    if (existingTitles.length === 0) {
      return [];
    }

    console.log(`[ML] Processing ${existingTitles.length + 1} titles in single request`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // Send all titles in one request
      const allTitles = [newTitle, ...existingTitles.map(t => t.judul)];
      
      const response = await fetch(`${ML_SERVICE_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputs: allTitles,
          normalize: true // L2 normalization by TEI
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ML service error: ${response.status}`);
      }

      const embeddings = (await response.json()) as number[][];
      const newTitleEmbedding = embeddings[0];
      
      // Calculate similarities using dot product (already normalized)
      const results = existingTitles.map((title, i) => {
        const similarity = cosineSimilarity(newTitleEmbedding, embeddings[i + 1]);
        return {
          id: title.id,
          judul: title.judul,
          similarity: Math.round(similarity * 100),
        };
      });

      console.log(`[ML] Completed: ${results.length} similarities calculated`);
      return results.sort((a, b) => b.similarity - a.similarity);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[ML] Similarity calculation failed:', error);
    return [];
  }
}
