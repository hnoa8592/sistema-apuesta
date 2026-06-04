import { Component, signal, inject, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationService } from '../../core/services/notification.service';
import { Toast } from '../../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <!-- Offline banner -->
    @if (!isOnline()) {
      <div class="fixed top-0 left-0 right-0 z-50 bg-[var(--q-danger)] text-white text-xs font-medium py-2 text-center">
        Sin conexión · Mostrando datos guardados
      </div>
    }

    <!-- Mobile topbar -->
    <app-topbar (menuToggle)="sidebarOpen.set(true)" />

    <div class="flex h-screen" [class.pt-14]="true">
      <!-- Desktop sidebar -->
      <div class="hidden lg:flex h-full border-r border-[var(--q-surface-2)]">
        <app-sidebar [open]="true" [isMobile]="false" />
      </div>

      <!-- Mobile sidebar overlay -->
      <app-sidebar
        [open]="sidebarOpen()"
        [isMobile]="true"
        (close)="sidebarOpen.set(false)"
        class="lg:hidden"
      />

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto bg-[var(--q-bg)]">
        <router-outlet />
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
         aria-live="polite">
      @for (toast of notify.toasts(); track toast.id) {
        <div [class]="toastClass(toast)"
             class="pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--radius-md)] shadow-lg">
          <span>{{ toastIcon(toast) }}</span>
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button (click)="notify.remove(toast.id)"
                  class="text-current opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      }
    </div>
  `,
})
export class ShellComponent implements OnInit {
  notify = inject(NotificationService);
  sidebarOpen = signal(false);
  isOnline = signal(navigator.onLine);

  ngOnInit() {
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.sidebarOpen.set(false); }

  toastClass(toast: Toast) {
    const variants: Record<Toast['type'], string> = {
      success: 'bg-green-600 text-white',
      error:   'bg-[var(--q-danger)] text-white',
      info:    'bg-[var(--q-fg)] text-[var(--q-bg)]',
      warning: 'bg-amber-500 text-white',
    };
    return variants[toast.type];
  }

  toastIcon(toast: Toast) {
    return { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[toast.type];
  }
}
