// src/components/bottle_V1.1/tools/toolOrchestrator.js

export function parseToolCallMaybe(text) {
  const trimmed = (text || '').trim();
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object' && obj.tool && obj.action) return obj;
  } catch (_) {}

  const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match) {
    try {
      const obj = JSON.parse(match[1]);
      if (obj && typeof obj === 'object' && obj.tool && obj.action) return obj;
    } catch (_) {}
  }
  return null;
}

/**
 * Orchestrate tool calls until a final textual answer is produced or maxSteps reached.
 * @param {object} params
 * @param {(parts: Array<{text: string}>) => Promise<{ text: string }>} params.llmSend
 * @param {object} params.tools { searchTool?, webFetchTool? }
 * @param {object} params.config agent config with tools settings
 * @param {string} params.userText
 * @param {number} [params.maxSteps=4]
 */
export async function runToolOrchestration({ llmSend, tools, config, userText, maxSteps = 4 }) {
  const contextMessages = [{ text: userText }];
  const citations = [];

  for (let step = 0; step < maxSteps; step++) {
    const response = await llmSend(contextMessages);
    const toolCall = parseToolCallMaybe(response.text);

    if (!toolCall) {
      const finalText = citations.length
        ? `${response.text}\n\nSources:\n${citations.map(c => `- ${c.title || c.url || c.id} ${c.url ? `(${c.url})` : ''}`).join('\n')}`
        : response.text;
      return { text: finalText };
    }

    const { tool, action, args } = toolCall;

    if (tool === 'search' && action === 'vector' && config?.tools?.search && tools.searchTool) {
      const query = args?.query || userText;
      const topK = args?.topK ?? 5;
      const results = await tools.searchTool.search(query, { topK });
      results.slice(0, 5).forEach(r => {
        citations.push({ id: r.id, title: r.title, url: r.url });
      });
      contextMessages.push({ text: `SEARCH_RESULTS:\n${JSON.stringify(results.slice(0, 5), null, 2)}` });
      continue;
    }

    if (tool === 'fetch' && action === 'url' && config?.tools?.webFetch && tools.webFetchTool) {
      const url = args?.url;
      if (!url) {
        contextMessages.push({ text: 'ERROR: Missing url for fetch tool' });
        continue;
      }
      const page = await tools.webFetchTool.fetchAndExtract(url);
      citations.push({ title: page.title || url, url });
      const excerpt = page.contentText.slice(0, 4000);
      contextMessages.push({ text: `FETCH_RESULT for ${url}:\nTitle: ${page.title}\nContentExcerpt:\n${excerpt}` });
      continue;
    }

    contextMessages.push({ text: `ERROR: Tool not available or disabled: ${tool}:${action}` });
  }

  return { text: 'I reached the maximum number of tool steps. Please refine your request.' };
}
