import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { CMS_API_BASE_URL } from '../../api.config';
import type { Category } from '../../models/category.model';
import type { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product';
import { enrichProductsWithCategories } from '../../utils/merge-product-categories';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type DetailVm =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'notfound' }
  | { kind: 'ok'; product: Product };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly products = inject(ProductService);
  private readonly categories = inject(CategoryService);
  private readonly snack = inject(MatSnackBar);
  private readonly apiBase = CMS_API_BASE_URL.replace(/\/$/, '') || undefined;

  protected readonly vm = toSignal(
    this.route.paramMap.pipe(
      switchMap((pm) => {
        const documentId = pm.get('documentId')?.trim() ?? '';
        if (!documentId || /[/\s?#]/.test(documentId)) {
          return of<DetailVm>({ kind: 'invalid' });
        }
        return forkJoin({
          product: this.products.getByDocumentId(documentId),
          categories: this.categories
            .getCategories()
            .pipe(catchError(() => of([] as Category[]))),
        }).pipe(
          map(({ product, categories }): DetailVm => {
            if (!product) {
              return { kind: 'notfound' };
            }
            const enriched = enrichProductsWithCategories(
              [product],
              categories,
            )[0];
            return { kind: 'ok', product: enriched };
          }),
          startWith<DetailVm>({ kind: 'loading' }),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } as DetailVm },
  );

  /** Produit affiché lorsque `vm().kind === 'ok'` (pour le template). */
  protected readonly detailProduct = computed(() => {
    const v = this.vm();
    return v.kind === 'ok' ? v.product : null;
  });

  protected formatPrice(p: Product): string {
    return `${p.price.toFixed(2).replace('.', ',')} €`;
  }

  protected imageUrl(p: Product): string | null {
    let url = p.image?.url;
    if (url?.startsWith('/') && this.apiBase) {
      url = `${this.apiBase}${url}`;
    }
    return url ?? null;
  }

  protected addToCart(product: Product): void {
    if (product.stock < 1) {
      return;
    }
    this.snack.open(
      `« ${product.title} » — ajouté au panier (démo).`,
      'Fermer',
      { duration: 3500 },
    );
  }
}
