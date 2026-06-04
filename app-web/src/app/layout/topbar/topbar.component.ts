import { Component, inject, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--q-surface)] border-b border-[var(--q-surface-2)] flex items-center justify-between px-4">
      <a routerLink="/explorar" class="flex items-center gap-2 text-[var(--q-fg)] font-bold font-display text-lg no-underline">
        ⚽ <span>TECnoa</span>
      </a>
      <button (click)="menuToggle.emit()"
              class="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--q-surface-2)] transition-colors"
              aria-label="Menú">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8"
             stroke="currentColor" class="w-5 h-5 text-[var(--q-fg)]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>
    </header>
  `,
})
export class TopbarComponent {
  auth = inject(AuthService);
  menuToggle = output<void>();
}
