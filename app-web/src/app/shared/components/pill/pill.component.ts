import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PillVariant = 'default' | 'accent' | 'live' | 'success' | 'danger' | 'organizer';

@Component({
  selector: 'app-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="classes()">{{ label() }}</span>
  `,
})
export class PillComponent {
  label   = input.required<string>();
  variant = input<PillVariant>('default');

  classes() {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold';
    const variants: Record<PillVariant, string> = {
      default:   'bg-[var(--q-surface-2)] text-[var(--q-fg-2)]',
      accent:    'bg-[var(--q-accent)] text-[var(--q-fg)]',
      live:      'bg-[var(--q-danger)] text-white animate-pulse',
      success:   'bg-green-100 text-green-800',
      danger:    'bg-red-100 text-[var(--q-danger)]',
      organizer: 'bg-purple-100 text-purple-800',
    };
    return `${base} ${variants[this.variant()]}`;
  }
}
