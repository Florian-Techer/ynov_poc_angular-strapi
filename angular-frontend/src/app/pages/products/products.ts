import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { CMS_API_BASE_URL } from '../../api.config';
import { ItemList } from '../../components/item-list/item-list';
import type { ItemCardData } from '../../components/item-card/item-card.types';
import { productToItemCard } from '../../mappers/product-to-item-card';
import type { Category } from '../../models/category.model';
import type { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product';
import { enrichProductsWithCategories } from '../../utils/merge-product-categories';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ItemList,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private readonly productsApi = inject(ProductService);
  private readonly categoryApi = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly apiBase = CMS_API_BASE_URL.replace(/\/$/, '') || undefined;

  protected readonly loading = signal(true);

  private readonly catalogState = toSignal(
    forkJoin({
      products: this.productsApi.getAll(),
      categories: this.categoryApi
        .getCategories()
        .pipe(catchError(() => of([] as Category[]))),
    }).pipe(finalize(() => this.loading.set(false))),
    {
      initialValue: {
        products: [] as Product[],
        categories: [] as Category[],
      },
    },
  );

  protected readonly allProducts = computed(
    () => this.catalogState().products,
  );

  /** Produits dont la catégorie est alignée sur `GET /api/categories` (filtrage par `id`). */
  protected readonly catalogProducts = computed(() =>
    enrichProductsWithCategories(
      this.allProducts(),
      this.catalogState().categories,
    ),
  );

  protected readonly apiCategories = computed(() =>
    [...this.catalogState().categories].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr'),
    ),
  );

  protected readonly searchQuery = signal('');
  protected readonly categoryFilter = signal('');
  protected readonly priceMin = signal<number | null>(null);
  protected readonly priceMax = signal<number | null>(null);

  protected readonly hasUncategorized = computed(() =>
    this.catalogProducts().some((p) => !p.category?.id),
  );

  protected readonly priceStats = computed(() => {
    const prices = this.catalogProducts().map((p) => p.price);
    if (!prices.length) {
      return { min: 0, max: 0 };
    }
    return { min: Math.min(...prices), max: Math.max(...prices) };
  });

  protected readonly filteredItems = computed(() => {
    let list = this.catalogProducts();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    const cat = this.categoryFilter();
    if (cat === '__none__') {
      list = list.filter((p) => !p.category?.id);
    } else if (cat) {
      const categoryId = Number.parseInt(cat, 10);
      if (!Number.isNaN(categoryId)) {
        list = list.filter((p) => p.category?.id === categoryId);
      }
    }
    const min = this.priceMin();
    const max = this.priceMax();
    if (min != null && !Number.isNaN(min)) {
      list = list.filter((p) => p.price >= min);
    }
    if (max != null && !Number.isNaN(max)) {
      list = list.filter((p) => p.price <= max);
    }
    return list.map((p) => productToItemCard(p, this.apiBase));
  });

  protected onSearchInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.searchQuery.set(v);
  }

  protected onPriceMinInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (raw === '') {
      this.priceMin.set(null);
      return;
    }
    const n = Number.parseFloat(raw.replace(',', '.'));
    this.priceMin.set(Number.isNaN(n) ? null : n);
  }

  protected onPriceMaxInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (raw === '') {
      this.priceMax.set(null);
      return;
    }
    const n = Number.parseFloat(raw.replace(',', '.'));
    this.priceMax.set(Number.isNaN(n) ? null : n);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.priceMin.set(null);
    this.priceMax.set(null);
  }

  protected onItemAction(item: ItemCardData): void {
    const doc = item.documentId?.trim();
    if (doc) {
      this.router.navigate(['/products', doc]);
      return;
    }
    const id = item.id;
    if (id !== undefined && id !== null) {
      this.router.navigate(['/products', String(id)]);
    }
  }
}
