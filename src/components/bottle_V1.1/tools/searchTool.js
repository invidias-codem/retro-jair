// src/components/bottle_V1.1/tools/searchTool.js
/**
 * Provider-agnostic search tool interface now backed by Vertex AI Vector Search via proxy.
 * Secrets and credentials are stored server-side. The client calls our proxy endpoint.
 */

export class SearchTool {
  constructor({ fetcher } = {}) {
    this.fetcher = fetcher || fetch.bind(window);
  }

  /**
   * Perform a vector search via server proxy (Vertex AI Vector Search v2).
   * @param {string} query
   * @param {object} options { topK?: number, hybrid?: boolean }
   * @returns {Promise<Array<{ id: string, title?: string, snippet?: string, score?: number, url?: string, metadata?: object }>>}
   */
  async search(query, options = {}) {
    if (!query || !query.trim()) throw new Error('Query is required for search');

    const params = new URLSearchParams({
      q: query,
      topK: String(options.topK ?? 5),
      hybrid: String(!!options.hybrid),
    });

    const res = await this.fetcher(`/api/vector-search?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Vector search proxy failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  }
}
