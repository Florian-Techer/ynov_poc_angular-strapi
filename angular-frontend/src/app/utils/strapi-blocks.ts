/**
 * Extrait un texte lisible depuis le format Blocks (Strapi rich text / JSON).
 */
function collectText(node: unknown): string {
  if (node == null) {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join('');
  }
  if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o['text'] === 'string') {
      return o['text'] as string;
    }
    if (Array.isArray(o['children'])) {
      return collectText(o['children']);
    }
  }
  return '';
}

export function strapiBlocksToPlainText(blocks: unknown): string {
  if (typeof blocks === 'string') {
    return blocks;
  }
  if (!Array.isArray(blocks)) {
    return '';
  }
  return blocks.map((block) => collectText(block)).filter(Boolean).join('\n\n');
}
