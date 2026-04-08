import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { CMS_API_BASE_URL } from '../../api.config';
import { ItemList } from '../../components/item-list/item-list';
import type { ItemCardData } from '../../components/item-card/item-card.types';
import { productToItemCard } from '../../mappers/product-to-item-card';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ItemList, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly products = inject(ProductService);
  private readonly router = inject(Router);
  private readonly apiBase = CMS_API_BASE_URL.replace(/\/$/, '') || undefined;

  protected readonly latestItems = toSignal(
    this.products.getLatest(5).pipe(
      map((list) =>
        list.map((p) => productToItemCard(p, this.apiBase)),
      ),
    ),
    { initialValue: [] as ItemCardData[] },
  );

  protected onArticleAction(item: ItemCardData): void {
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
