import type { ItemCardData } from '../components/item-card/item-card.types';
import type { Product } from '../models/product.model';

export function productToItemCard(
  product: Product,
  apiBaseUrl?: string,
): ItemCardData {
  let imageUrl = product.image?.url;
  if (imageUrl && apiBaseUrl && imageUrl.startsWith('/')) {
    imageUrl = `${apiBaseUrl}${imageUrl}`;
  }

  const priceLabel =
    product.price !== undefined
      ? `${product.price.toFixed(2)} €`
      : undefined;

  return {
    id: product.id,
    documentId: product.documentId,
    title: product.title,
    subtitle: product.category?.name ?? priceLabel,
    description: product.description,
    imageUrl: imageUrl ?? null,
    imageAlt: product.title,
  };
}
