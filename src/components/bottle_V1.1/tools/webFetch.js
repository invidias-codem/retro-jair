// src/components/bottle_V1.1/tools/webFetch.js
export class WebFetchTool {
  constructor({ fetcher } = {}) {
    this.fetcher = fetcher || fetch.bind(window);
  }

  /**
   * Fetch a URL via server proxy and extract readable content.
   * @param {string} url
   * @returns {Promise<{ url: string, title?: string, contentText: string, wordCount: number }>}
   */
  async fetchAndExtract(url) {
    if (!url || !/^https?:\/\//i.test(url)) {
      throw new Error('Valid URL is required for fetch');
    }

    const res = await this.fetcher('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Fetch proxy failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const contentText = data.contentText || '';
    return {
      url,
      title: data.title || '',
      contentText,
      wordCount: contentText.split(/\s+/).filter(Boolean).length
    };
  }
}
