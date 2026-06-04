import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="cancel.emit()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-6 max-w-sm w-full shadow-2xl"
             (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-[var(--q-fg)] mb-2">{{ title() }}</h3>
          <p class="text-sm text-[var(--q-fg-2)] mb-6">{{ message() }}</p>
          <div class="flex gap-3 justify-end">
            <button (click)="cancel.emit()"
                    class="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--q-fg-2)] text-sm font-medium text-[var(--q-fg)] hover:bg-[var(--q-surface-2)] transition-colors">
              {{ cancelLabel() }}
            </button>
            <button (click)="confirm.emit()"
                    [class]="confirmClass()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  open         = input(false);
  title        = input('¿Estás seguro?');
  message      = input('');
  confirmLabel = input('Confirmar');
  cancelLabel  = input('Cancelar');
  variant      = input<'default' | 'danger'>('default');
  confirm      = output<void>();
  cancel       = output<void>();

  confirmClass() {
    const base = 'px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors';
    return this.variant() === 'danger'
      ? `${base} bg-[var(--q-danger)] text-white hover:opacity-90`
      : `${base} bg-[var(--q-accent)] text-[var(--q-fg)] hover:opacity-90`;
  }
}
