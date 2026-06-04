import { Component, inject, input, output } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, RouterLinkActive, CommonModule, AvatarComponent, ConfirmDialogComponent],
  template: `
    <!-- Overlay for mobile -->
    @if (open() && isMobile()) {
      <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="close.emit()"></div>
    }

    <!-- Sidebar panel -->
    <aside [class]="sidebarClasses()">
      <!-- Logo -->
      <div class="p-5 border-b border-[var(--q-surface-2)]">
        <a routerLink="/explorar" class="flex items-center gap-2 text-[var(--q-fg)] no-underline" (click)="close.emit()">
          <span class="text-2xl">⚽</span>
          <span class="font-bold font-display text-xl">TECnoa</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="bg-[var(--q-accent)] text-[var(--q-fg)]"
             [routerLinkActiveOptions]="{ exact: false }"
             (click)="close.emit()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--q-fg-2)] hover:bg-[var(--q-surface-2)] hover:text-[var(--q-fg)] transition-colors font-medium text-sm no-underline">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-[var(--q-surface-2)]">
        <div class="flex items-center gap-3 mb-3">
          <app-avatar [name]="auth.user()?.name || '?'" [pictureUrl]="auth.user()?.pictureUrl" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[var(--q-fg)] truncate">{{ auth.user()?.name }}</p>
            <p class="text-xs text-[var(--q-fg-3)] truncate">{{ auth.user()?.email }}</p>
          </div>
        </div>
        <button (click)="showLogout = true"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[var(--q-danger)] text-sm font-medium hover:bg-red-50 transition-colors">
          🚪 <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <app-confirm-dialog
      [open]="showLogout"
      title="¿Cerrar sesión?"
      message="Se cerrará tu sesión en este dispositivo."
      confirmLabel="Cerrar sesión"
      cancelLabel="Cancelar"
      variant="danger"
      (confirm)="logout()"
      (cancel)="showLogout = false"
    />
  `,
})
export class SidebarComponent {
  auth  = inject(AuthService);
  open  = input(true);
  isMobile = input(false);
  close = output<void>();

  showLogout = false;

  navItems: NavItem[] = [
    { icon: '🔭', label: 'Explorar', route: '/explorar' },
    { icon: '🏆', label: 'Mis grupos', route: '/mis-grupos' },
    { icon: '📋', label: 'Historial', route: '/historial' },
    { icon: '👤', label: 'Perfil', route: '/perfil' },
  ];

  sidebarClasses() {
    const base = 'flex flex-col bg-[var(--q-surface)] h-full';
    if (this.isMobile()) {
      return `${base} fixed top-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-300 ${this.open() ? 'translate-x-0' : '-translate-x-full'}`;
    }
    return `${base} w-60 shrink-0`;
  }

  logout() {
    this.showLogout = false;
    this.auth.logout();
  }
}
