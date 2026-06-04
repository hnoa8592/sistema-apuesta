import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserStats } from '../../core/models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent, PillComponent, ConfirmDialogComponent],
  template: `
    <div class="p-4 md:p-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold font-display text-[var(--q-fg)]">Perfil</h1>
        <button class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">⚙️</button>
      </div>

      <!-- Profile card -->
      <div class="bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-5 mb-6">
        <div class="flex items-center gap-4">
          <app-avatar [name]="auth.user()?.name || '?'" [pictureUrl]="auth.user()?.pictureUrl" size="xl" />
          <div>
            <h2 class="text-lg font-bold text-[var(--q-fg)]">{{ auth.user()?.name }}</h2>
            <p class="text-sm text-[var(--q-fg-2)]">{{ auth.user()?.email }}</p>
            <div class="flex gap-2 mt-2">
              <app-pill label="Google" variant="default" />
              @if (auth.user()?.emailVerified) {
                <app-pill label="✓ Verificado" variant="success" />
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      @if (stats()) {
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Torneos jugados</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.tournamentsPlayed }}</p>
          </div>
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Torneos ganados</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.tournamentsWon }}</p>
          </div>
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Pts acumulados</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.totalPoints }}</p>
          </div>
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Tasa de acierto</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.correctResultRate | number:'1.0-0' }}%</p>
          </div>
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Marcadores exactos</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.exactScores }}</p>
          </div>
          <div class="bg-[var(--q-surface)] rounded-[var(--radius-md)] p-3">
            <p class="text-xs text-[var(--q-fg-3)]">Racha actual</p>
            <p class="text-xl font-bold font-display text-[var(--q-fg)]">{{ stats()!.currentStreak }}</p>
          </div>
        </div>
      }

      <!-- Account settings -->
      <div class="bg-[var(--q-surface)] rounded-[var(--radius-xl)] overflow-hidden mb-4">
        @for (item of menuItems; track item.label) {
          <button (click)="item.action()"
                  class="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--q-surface-2)] transition-colors border-b border-[var(--q-surface-2)] last:border-0"
                  [class.text-[var(--q-danger)]]="item.danger">
            <span class="text-xl">{{ item.icon }}</span>
            <span class="flex-1 text-sm font-medium text-left">{{ item.label }}</span>
            @if (!item.danger) { <span class="text-[var(--q-fg-3)]">›</span> }
          </button>
        }
      </div>

      <!-- Footer -->
      <p class="text-xs text-[var(--q-fg-3)] text-center">TECnoa · v1.0.0</p>
    </div>

    <app-confirm-dialog
      [open]="showLogout()"
      title="¿Cerrar sesión?"
      message="Se cerrará tu sesión en este dispositivo."
      confirmLabel="Cerrar sesión"
      cancelLabel="Cancelar"
      variant="danger"
      (confirm)="auth.logout()"
      (cancel)="showLogout.set(false)"
    />
  `,
})
export class ProfileComponent implements OnInit {
  auth       = inject(AuthService);
  private userSvc = inject(UserService);

  stats      = signal<UserStats | null>(null);
  showLogout = signal(false);
  darkMode   = signal(document.documentElement.classList.contains('dark'));

  menuItems = [
    { icon: '🔔', label: 'Notificaciones', action: () => {}, danger: false },
    {
      icon: '🌙', label: 'Modo oscuro', danger: false,
      action: () => {
        document.documentElement.classList.toggle('dark');
        this.darkMode.set(!this.darkMode());
        localStorage.setItem('darkMode', String(this.darkMode()));
      },
    },
    { icon: '🏆', label: 'Mi historial',  action: () => {}, danger: false },
    { icon: '👤', label: 'Editar perfil', action: () => {}, danger: false },
    { icon: '🚪', label: 'Cerrar sesión', action: () => this.showLogout.set(true), danger: true },
  ];

  ngOnInit() {
    this.userSvc.getStats().subscribe(s => this.stats.set(s));
  }
}
