export interface Category {
  id: number;
  documentId?: string;
  /** Libellé affiché (Strapi : `category_name`). */
  name: string;
  slug: string;
}
