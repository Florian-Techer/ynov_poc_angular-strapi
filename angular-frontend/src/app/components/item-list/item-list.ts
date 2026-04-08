import { Component, computed, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ItemCard } from '../item-card/item-card';
import type { ItemCardData } from '../item-card/item-card.types';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [ItemCard, MatPaginatorModule],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
})
export class ItemList {
  readonly items = input.required<ItemCardData[]>();
  /** Nombre total d’éléments côté CMS (pour la pagination). */
  readonly totalCount = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  /** Si défini, affiche un bouton d’action sur chaque carte. */
  readonly actionLabel = input<string>();
  readonly showPaginator = input(true);

  readonly pageChange = output<PageEvent>();
  readonly itemAction = output<ItemCardData>();

  protected readonly showPagination = computed(() => {
    if (!this.showPaginator()) {
      return false;
    }
    return this.totalCount() > 0;
  });

  protected trackItem(_index: number, item: ItemCardData): string | number {
    if (item.id !== undefined && item.id !== null && item.id !== '') {
      return item.id;
    }
    return `${item.title}-${_index}`;
  }

  protected onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  protected onItemAction(item: ItemCardData): void {
    this.itemAction.emit(item);
  }
}
