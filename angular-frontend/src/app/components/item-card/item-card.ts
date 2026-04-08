import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import type { ItemCardData } from './item-card.types';

export type { ItemCardData } from './item-card.types';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})
export class ItemCard {
  readonly item = input.required<ItemCardData>();
  /** Libellé du bouton d’action ; si vide, la zone actions est masquée. */
  readonly actionLabel = input<string>();
  readonly action = output<void>();

  protected onActionClick(event: Event): void {
    event.stopPropagation();
    this.action.emit();
  }
}
