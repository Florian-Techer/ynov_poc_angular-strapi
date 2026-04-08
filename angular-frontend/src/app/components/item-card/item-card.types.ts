/** Données d’affichage minimales pour une carte CMS / catalogue. */
export interface ItemCardData {
  id?: string | number;
  /** Strapi v5 — utilisé pour l’URL `/products/:documentId`. */
  documentId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string | null;
  imageAlt?: string;
}
