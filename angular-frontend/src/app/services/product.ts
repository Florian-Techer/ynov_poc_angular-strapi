import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CMS_API_BASE_URL, CMS_API_READ_TOKEN } from '../api.config';
import type { Product } from '../models/product.model';
import { strapiBlocksToPlainText } from '../utils/strapi-blocks';

/** Entrée produit Strapi 5 (REST) — champs plats dans `data[]`. */
interface Strapi5ProductDto {
  id: number;
  documentId?: string;
  title?: string;
  slug?: string;
  description?: unknown;
  price?: number;
  stock?: number;
  createdAt?: string;
  image?: { url?: string } | null;
  category?: StrapiCategoryRaw | null;
}

function parseStrapiId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function categoryFromIdOnly(
  id: number,
  documentId?: string,
): NonNullable<Product['category']> {
  return {
    id,
    documentId,
    name: '',
    slug: '',
  };
}

/** Catégorie Strapi : objet complet, relation peuplée, ou seulement `id` / `documentId`. */
type StrapiCategoryRaw =
  | number
  | string
  | { name?: string; slug?: string; category_name?: string; id?: number; documentId?: string }
  | {
      data?:
        | {
            id?: number;
            documentId?: string;
            name?: string;
            slug?: string;
            category_name?: string;
            attributes?: {
              name?: string;
              slug?: string;
              category_name?: string;
            };
          }
        | null;
    };

interface Strapi5ListResponse {
  data: Strapi5ProductDto[];
  meta?: {
    pagination?: {
      page?: number;
      pageSize?: number;
      pageCount?: number;
      total?: number;
    };
  };
}

interface Strapi5SingleResponse {
  data: Strapi5ProductDto | null;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    documentId: 'mock-doc-tshirt-bio',
    title: 'T-shirt coton bio',
    slug: 't-shirt-coton-bio',
    description: 'Coupe regular, col rond. Coton biologique certifié, confection européenne.',
    price: 39.9,
    stock: 42,
    image: {
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    },
    category: { id: 1, name: 'Hauts', slug: 'hauts' },
  },
  {
    id: 2,
    documentId: 'mock-doc-chemise-lin',
    title: 'Chemise lin',
    slug: 'chemise-lin',
    description: 'Lin léger pour l’été, boutons nacre, silhouette droite.',
    price: 89.0,
    stock: 18,
    image: {
      url: 'https://images.unsplash.com/photo-1596755094514-f87d340867b1?w=800&q=80',
    },
    category: { id: 1, name: 'Hauts', slug: 'hauts' },
  },
  {
    id: 3,
    documentId: 'mock-doc-jean-slim',
    title: 'Jean slim indigo',
    slug: 'jean-slim-indigo',
    description: 'Denim stretch confortable, ourlet brut. Lavage indigo profond.',
    price: 79.5,
    stock: 30,
    image: {
      url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    },
    category: { id: 2, name: 'Bas', slug: 'bas' },
  },
  {
    id: 4,
    documentId: 'mock-doc-pantalon-tailleur',
    title: 'Pantalon tailleur',
    slug: 'pantalon-tailleur',
    description: 'Jambe droite, plis marqués, tissu infroissable pour le bureau.',
    price: 119.0,
    stock: 12,
    image: {
      url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    },
    category: { id: 2, name: 'Bas', slug: 'bas' },
  },
  {
    id: 5,
    documentId: 'mock-doc-sneakers',
    title: 'Sneakers cuir',
    slug: 'sneakers-cuir',
    description: 'Semelle amortissante, empeigne cuir pleine fleur, look minimal.',
    price: 139.0,
    stock: 22,
    image: {
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    },
    category: { id: 3, name: 'Chaussures', slug: 'chaussures' },
  },
  {
    id: 6,
    documentId: 'mock-doc-veste-laine',
    title: 'Veste laine mélangée',
    slug: 'veste-laine-melangee',
    description: 'Coupe droite, deux poches plaquées. Idéale mi-saison.',
    price: 189.0,
    stock: 9,
    image: {
      url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
    },
    category: { id: 4, name: 'Manteaux & vestes', slug: 'manteaux-vestes' },
  },
  {
    id: 7,
    documentId: 'mock-doc-echarpe',
    title: 'Écharpe mérinos',
    slug: 'echarpe-merinos',
    description: 'Maille douce, longueur généreuse, teintes naturelles.',
    price: 49.0,
    stock: 35,
    image: {
      url: 'https://images.unsplash.com/photo-1520903920243-1b2a0100129a?w=800&q=80',
    },
    category: { id: 5, name: 'Accessoires', slug: 'accessoires' },
  },
  {
    id: 8,
    documentId: 'mock-doc-sac-cabas',
    title: 'Sac cabas cuir',
    slug: 'sac-cabas-cuir',
    description: 'Grand volume, anses renforcées, finition mate.',
    price: 159.0,
    stock: 7,
    image: {
      url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
    },
    category: { id: 5, name: 'Accessoires', slug: 'accessoires' },
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = CMS_API_BASE_URL.replace(/\/$/, '');
  private readonly apiToken = CMS_API_READ_TOKEN.trim();

  /**
   * Derniers produits (tri par date de création côté Strapi).
   */
  getLatest(limit = 5): Observable<Product[]> {
    if (!this.baseUrl) {
      return of(MOCK_PRODUCTS.slice(0, limit));
    }

    const url = `${this.baseUrl}/api/products`;
    const headers = this.authHeaders();

    return this.http
      .get<Strapi5ListResponse>(url, {
        ...(headers ? { headers } : {}),
        params: {
          sort: 'createdAt:desc',
          'pagination[pageSize]': String(limit),
          'pagination[page]': '1',
          populate: '*',
        },
      })
      .pipe(
        map((res) => (res.data ?? []).map((dto) => this.mapStrapi5Product(dto))),
        catchError(() => of(MOCK_PRODUCTS.slice(0, limit))),
      );
  }

  /**
   * Catalogue complet (jusqu’à 100 entrées par requête).
   * Les filtres (texte, catégorie, prix) sont appliqués côté client sur cette liste.
   */
  getAll(): Observable<Product[]> {
    if (!this.baseUrl) {
      return of([...MOCK_PRODUCTS]);
    }

    const url = `${this.baseUrl}/api/products`;
    const headers = this.authHeaders();
    return this.http
      .get<Strapi5ListResponse>(url, {
        ...(headers ? { headers } : {}),
        params: {
          sort: 'title:asc',
          'pagination[pageSize]': '100',
          'pagination[page]': '1',
          populate: '*',
        },
      })
      .pipe(
        map((res) => (res.data ?? []).map((dto) => this.mapStrapi5Product(dto))),
        catchError(() => of([...MOCK_PRODUCTS])),
      );
  }

  /**
   * Détail d’un produit par **documentId** Strapi (v5).
   * `GET /api/products/:documentId?populate=*`
   */
  getByDocumentId(documentId: string): Observable<Product | null> {
    const key = documentId.trim();
    if (!key) {
      return of(null);
    }

    if (!this.baseUrl) {
      const byDoc = MOCK_PRODUCTS.find((p) => p.documentId === key);
      if (byDoc) {
        return of(byDoc);
      }
      const asNum = Number.parseInt(key, 10);
      if (!Number.isNaN(asNum)) {
        return of(MOCK_PRODUCTS.find((p) => p.id === asNum) ?? null);
      }
      return of(null);
    }

    const url = `${this.baseUrl}/api/products/${encodeURIComponent(key)}`;
    const headers = this.authHeaders();
    return this.http
      .get<Strapi5SingleResponse>(url, {
        ...(headers ? { headers } : {}),
        params: { populate: '*' },
      })
      .pipe(
        map((res) =>
          res.data ? this.mapStrapi5Product(res.data) : null,
        ),
        catchError(() => {
          const byDoc = MOCK_PRODUCTS.find((p) => p.documentId === key);
          if (byDoc) {
            return of(byDoc);
          }
          const asNum = Number.parseInt(key, 10);
          if (!Number.isNaN(asNum)) {
            return of(MOCK_PRODUCTS.find((p) => p.id === asNum) ?? null);
          }
          return of(null);
        }),
      );
  }

  /** Liste paginée (pour une page catalogue, etc.). */
  getPage(
    page: number,
    pageSize: number,
  ): Observable<{ products: Product[]; total: number }> {
    if (!this.baseUrl) {
      const start = (page - 1) * pageSize;
      const slice = MOCK_PRODUCTS.slice(start, start + pageSize);
      return of({ products: slice, total: MOCK_PRODUCTS.length });
    }

    const url = `${this.baseUrl}/api/products`;
    const headers = this.authHeaders();
    return this.http
      .get<Strapi5ListResponse>(url, {
        ...(headers ? { headers } : {}),
        params: {
          sort: 'createdAt:desc',
          'pagination[pageSize]': String(pageSize),
          'pagination[page]': String(page),
          populate: '*',
        },
      })
      .pipe(
        map((res) => ({
          products: (res.data ?? []).map((dto) => this.mapStrapi5Product(dto)),
          total: res.meta?.pagination?.total ?? res.data?.length ?? 0,
        })),
        catchError(() =>
          of({
            products: MOCK_PRODUCTS.slice(0, pageSize),
            total: MOCK_PRODUCTS.length,
          }),
        ),
      );
  }

  private authHeaders(): HttpHeaders | undefined {
    if (!this.apiToken) {
      return undefined;
    }
    return new HttpHeaders({
      Authorization: `Bearer ${this.apiToken}`,
    });
  }

  private mapStrapi5Product(dto: Strapi5ProductDto): Product {
    const description = strapiBlocksToPlainText(dto.description);
    let imageUrl = dto.image?.url;
    if (imageUrl?.startsWith('/')) {
      imageUrl = `${this.baseUrl}${imageUrl}`;
    }

    return {
      id: dto.id,
      documentId: dto.documentId,
      title: dto.title ?? '',
      slug: dto.slug ?? '',
      description,
      price: dto.price ?? 0,
      stock: dto.stock ?? 0,
      image: imageUrl ? { url: imageUrl } : undefined,
      category: this.normalizeCategory(dto.category),
    };
  }

  private normalizeCategory(
    raw: StrapiCategoryRaw | null | undefined,
  ): Product['category'] {
    if (raw === null || raw === undefined) {
      return undefined;
    }
    if (typeof raw === 'number') {
      return categoryFromIdOnly(raw);
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      const sid = parseStrapiId(raw);
      if (sid != null) {
        return categoryFromIdOnly(sid);
      }
      return undefined;
    }
    if (typeof raw !== 'object') {
      return undefined;
    }
    const o = raw as Record<string, unknown>;

    const id = parseStrapiId(o['id']);
    const documentId =
      typeof o['documentId'] === 'string' ? o['documentId'] : undefined;

    if (typeof o['name'] === 'string' && typeof o['slug'] === 'string') {
      return { id, documentId, name: o['name'], slug: o['slug'] };
    }
    if (
      typeof o['category_name'] === 'string' &&
      typeof o['slug'] === 'string'
    ) {
      return { id, documentId, name: o['category_name'], slug: o['slug'] };
    }
    if (id != null) {
      return categoryFromIdOnly(id, documentId);
    }
    if (documentId) {
      return { documentId, name: '', slug: '' };
    }

    const data = o['data'] as Record<string, unknown> | null | undefined;
    if (data && typeof data === 'object') {
      const did = parseStrapiId(data['id']);
      const ddoc =
        typeof data['documentId'] === 'string' ? data['documentId'] : undefined;
      if (typeof data['name'] === 'string' && typeof data['slug'] === 'string') {
        return { id: did, documentId: ddoc, name: data['name'], slug: data['slug'] };
      }
      if (
        typeof data['category_name'] === 'string' &&
        typeof data['slug'] === 'string'
      ) {
        return {
          id: did,
          documentId: ddoc,
          name: data['category_name'],
          slug: data['slug'],
        };
      }
      if (did != null) {
        return categoryFromIdOnly(did, ddoc);
      }
      if (ddoc) {
        return { documentId: ddoc, name: '', slug: '' };
      }
      const attrs = data['attributes'] as Record<string, unknown> | undefined;
      if (
        attrs &&
        typeof attrs['name'] === 'string' &&
        typeof attrs['slug'] === 'string'
      ) {
        return { name: attrs['name'], slug: attrs['slug'] };
      }
      if (
        attrs &&
        typeof attrs['category_name'] === 'string' &&
        typeof attrs['slug'] === 'string'
      ) {
        return { name: attrs['category_name'], slug: attrs['slug'] };
      }
    }
    return undefined;
  }
}
