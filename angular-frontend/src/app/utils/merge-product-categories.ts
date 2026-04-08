import type { Category } from '../models/category.model';
import type { Product } from '../models/product.model';

/**
 * Aligne chaque produit sur la liste officielle des catégories (API),
 * en priorité par `id` puis `documentId`, pour que le filtre par catégorie
 * corresponde à tous les articles liés dans Strapi (souvent renvoyés comme `{ id }` seul).
 */
export function enrichProductsWithCategories(
  products: Product[],
  categories: Category[],
): Product[] {
  const byId = new Map<number, Category>();
  const byDoc = new Map<string, Category>();
  for (const c of categories) {
    byId.set(c.id, c);
    if (c.documentId) {
      byDoc.set(c.documentId, c);
    }
  }

  return products.map((p) => {
    const raw = p.category;
    if (!raw) {
      return p;
    }

    let resolved: Category | undefined;
    if (raw.id != null) {
      resolved = byId.get(raw.id);
    }
    if (!resolved && raw.documentId) {
      resolved = byDoc.get(raw.documentId);
    }

    if (resolved) {
      return {
        ...p,
        category: {
          id: resolved.id,
          documentId: resolved.documentId,
          name: resolved.name,
          slug: resolved.slug,
        },
      };
    }

    return p;
  });
}
