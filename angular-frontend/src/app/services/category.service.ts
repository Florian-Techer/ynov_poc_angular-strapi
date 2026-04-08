import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CMS_API_BASE_URL, CMS_API_READ_TOKEN } from '../api.config';
import type { Category } from '../models/category.model';

interface StrapiCategoryDto {
  id: number;
  documentId?: string;
  category_name?: string;
  slug?: string;
}

interface StrapiCategoryListResponse {
  data: StrapiCategoryDto[];
}

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Hauts', slug: 'hauts' },
  { id: 2, name: 'Bas', slug: 'bas' },
  { id: 3, name: 'Chaussures', slug: 'chaussures' },
  { id: 4, name: 'Manteaux & vestes', slug: 'manteaux-vestes' },
  { id: 5, name: 'Accessoires', slug: 'accessoires' },
];

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = CMS_API_BASE_URL.replace(/\/$/, '');
  private readonly apiToken = CMS_API_READ_TOKEN.trim();

  /**
   * Liste des catégories publiées (Strapi collection `categories`).
   */
  getCategories(): Observable<Category[]> {
    if (!this.baseUrl) {
      return of([...MOCK_CATEGORIES]);
    }

    const url = `${this.baseUrl}/api/categories`;
    const headers = this.authHeaders();

    return this.http
      .get<StrapiCategoryListResponse>(url, {
        ...(headers ? { headers } : {}),
        params: {
          'pagination[pageSize]': '100',
          'pagination[page]': '1',
        },
      })
      .pipe(
        map((res) => (res.data ?? []).map((dto) => this.mapDto(dto))),
        catchError(() => of([...MOCK_CATEGORIES])),
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

  private mapDto(dto: StrapiCategoryDto): Category {
    const name = dto.category_name?.trim() || dto.slug || 'Catégorie';
    return {
      id: dto.id,
      documentId: dto.documentId,
      name,
      slug: dto.slug ?? String(dto.id),
    };
  }
}
