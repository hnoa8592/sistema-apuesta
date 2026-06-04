import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pictureUrl()) {
      <img [src]="pictureUrl()" [alt]="name()"
           [class]="sizeClass()"
           class="rounded-full object-cover"
           (error)="showFallback = true" />
    }
    @if (!pictureUrl() || showFallback) {
      <div [class]="sizeClass()"
           class="rounded-full bg-[var(--q-accent)] flex items-center justify-center font-semibold text-[var(--q-fg)]">
        {{ initial() }}
      </div>
    }
  `,
})
export class AvatarComponent {
  name       = input.required<string>();
  pictureUrl = input<string | undefined>(undefined);
  size       = input<AvatarSize>('md');
  showFallback = false;

  initial = computed(() => (this.name() || '?')[0].toUpperCase());

  sizeClass = computed(() => {
    const sizes: Record<AvatarSize, string> = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-14 h-14 text-xl',
      xl: 'w-20 h-20 text-2xl',
    };
    return sizes[this.size()];
  });
}
