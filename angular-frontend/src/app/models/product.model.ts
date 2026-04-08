export interface Product {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image?: {
    url: string;
  };
  category?: {
    id?: number;
    documentId?: string;
    name: string;
    slug: string;
  };
}
