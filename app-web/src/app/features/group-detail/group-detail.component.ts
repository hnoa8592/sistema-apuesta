import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { GroupService, UpdateGroupRequest } from '../../core/services/group.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { BettingGroup } from '../../core/models';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { CurrencyBsPipe } from '../../shared/pipes/currency-bs.pipe';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    PillComponent, ConfirmDialogComponent,
    SkeletonComponent, CurrencyBsPipe, FormsModule,
  ],
  template: `
    @if (loading()) {
      <div class="p-6 space-y-4">
        <app-skeleton height="24px" width="40%" />
        <app-skeleton height="16px" width="60%" />
      </div>
    } @else if (group()) {
      <!-- Cover header -->
      <div class="bg-[var(--q-fg)] px-4 pt-4 pb-6">
        <div class="max-w-4xl mx-auto">
          <div class="flex items-center justify-between mb-4">
            <button (click)="router.navigate(['/mis-grupos'])"
                    class="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-[var(--q-bg)] hover:bg-white/20 transition-colors">
              ←
            </button>
            @if (isOrganizer()) {
              <button (click)="settingsOpen.set(!settingsOpen())"
                      class="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-[var(--q-bg)] hover:bg-white/20 transition-colors">
                ⚙️
              </button>
            }
          </div>

          <div class="flex items-center gap-2 mb-2">
            <app-pill [label]="group()!.tournament.type" variant="accent" />
            @if (group()!.tournament.status === 'IN_PROGRESS') {
              <app-pill label="EN VIVO" variant="live" />
            }
          </div>

          <h1 class="text-2xl font-bold font-display text-[var(--q-bg)] mb-1">{{ group()!.name }}</h1>
          <p class="text-sm text-[var(--q-bg)]/60 mb-5">
            {{ group()!.organizerName }} · {{ group()!.totalParticipants }} jugadores · {{ group()!.entryFee | currencyBs }} pozo
          </p>

          <div class="grid grid-cols-4 gap-3">
            <div class="bg-white/10 rounded-[var(--radius-md)] p-3 text-center">
              <p class="text-xl font-bold font-display text-[var(--q-bg)]">{{ group()!.myPosition ?? '—' }}</p>
              <p class="text-xs text-[var(--q-bg)]/60">Pos.</p>
            </div>
            <div class="bg-white/10 rounded-[var(--radius-md)] p-3 text-center">
              <p class="text-xl font-bold font-display text-[var(--q-bg)]">{{ group()!.myPoints ?? 0 }}</p>
              <p class="text-xs text-[var(--q-bg)]/60">Pts</p>
            </div>
            <div class="bg-white/10 rounded-[var(--radius-md)] p-3 text-center">
              <p class="text-xl font-bold font-display text-[var(--q-bg)]">{{ group()!.myCorrectPredictions ?? 0 }}</p>
              <p class="text-xs text-[var(--q-bg)]/60">Aciertos</p>
            </div>
            <div class="bg-white/10 rounded-[var(--radius-md)] p-3 text-center">
              <p class="text-xl font-bold font-display text-[var(--q-bg)]">{{ group()!.myExactPredictions ?? 0 }}</p>
              <p class="text-xs text-[var(--q-bg)]/60">Exactos</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Wildcards card (if enabled) -->
      @if (group()!.wildcardsEnabled) {
        <div class="max-w-4xl mx-auto px-4 pt-4">
          <div (click)="router.navigate(['/grupos', group()!.id, 'comodines'])"
               class="bg-[var(--q-surface)] border border-[var(--q-surface-2)] rounded-[var(--radius-md)] p-3 flex items-center gap-3 cursor-pointer hover:border-[var(--q-accent)]">
            <span class="text-2xl">⭐</span>
            <div class="flex-1">
              <p class="text-sm font-semibold text-[var(--q-fg)]">Comodines</p>
              <p class="text-xs text-[var(--q-fg-3)]">Gestionar mis 5 elecciones especiales</p>
            </div>
            <span class="text-[var(--q-fg-3)]">›</span>
          </div>
        </div>
      }

      <!-- Tabs -->
      <div class="max-w-4xl mx-auto px-4 mt-4">
        <div class="flex border-b border-[var(--q-surface-2)]">
          @for (tab of tabs; track tab.route) {
            <a [routerLink]="tab.route" routerLinkActive="border-b-2 border-[var(--q-accent)] text-[var(--q-fg)]"
               [routerLinkActiveOptions]="{ exact: false }"
               class="px-4 py-2.5 text-sm font-medium text-[var(--q-fg-2)] hover:text-[var(--q-fg)] transition-colors no-underline">
              {{ tab.label }}
            </a>
          }
        </div>
      </div>

      <!-- Nested router outlet -->
      <div class="max-w-4xl mx-auto">
        <router-outlet />
      </div>
    }

    <!-- Settings drawer -->
    @if (settingsOpen() && group()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="settingsOpen.set(false)">
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="relative bg-[var(--q-surface)] w-80 h-full p-5 overflow-y-auto shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-[var(--q-fg)]">Configuración del grupo</h3>
            <button (click)="settingsOpen.set(false)" class="text-2xl text-[var(--q-fg-3)]">×</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-xs font-medium text-[var(--q-fg-3)] uppercase tracking-wide block mb-1.5">
                Código de invitación
              </label>
              <div class="flex items-center gap-2 bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] p-3">
                <code class="flex-1 text-sm font-mono text-[var(--q-fg)]">{{ group()!.inviteCode }}</code>
                <button (click)="copyInvite()" class="text-xs text-[var(--q-accent)] font-semibold">Copiar</button>
              </div>
            </div>

            @if (group()!.tournament.status === 'SCHEDULED') {
              <div>
                <label class="text-xs font-medium text-[var(--q-fg-3)] uppercase tracking-wide block mb-1.5">
                  Nuevo nombre
                </label>
                <input [(ngModel)]="editName" type="text"
                       class="w-full px-3 py-2 bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] text-sm text-[var(--q-fg)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
              </div>
              <button (click)="saveSettings()"
                      class="w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">
                Guardar cambios
              </button>
              <button (click)="confirmDelete.set(true)"
                      class="w-full py-2.5 rounded-[var(--radius-md)] border border-[var(--q-danger)] text-[var(--q-danger)] font-semibold text-sm">
                Disolver grupo
              </button>
            } @else {
              <p class="text-xs text-[var(--q-fg-3)] bg-[var(--q-surface-2)] rounded-[var(--radius-sm)] p-3">
                La configuración está bloqueada porque el torneo ya ha iniciado.
              </p>
            }
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [open]="confirmDelete()"
      title="¿Disolver el grupo?"
      message="Se eliminarán todos los pronósticos y participantes. Esta acción no se puede deshacer."
      confirmLabel="Disolver"
      cancelLabel="Cancelar"
      variant="danger"
      (confirm)="deleteGroup()"
      (cancel)="confirmDelete.set(false)"
    />
  `,
})
export class GroupDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private groupSvc = inject(GroupService);
  private authSvc  = inject(AuthService);
  private notify   = inject(NotificationService);
  router = inject(Router);

  loading       = signal(true);
  group         = signal<BettingGroup | null>(null);
  settingsOpen  = signal(false);
  confirmDelete = signal(false);
  editName      = '';

  isOrganizer = () => this.group()?.organizerId === this.authSvc.user()?.id;

  tabs = [
    { label: 'Puntajes',      route: 'puntajes' },
    { label: 'Pronósticos',   route: 'pronosticos' },
    { label: 'Próximos',      route: 'proximos' },
    { label: 'Participantes', route: 'participantes' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupSvc.getGroupById(id).subscribe({
      next: g => { this.group.set(g); this.editName = g.name; this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  copyInvite() {
    navigator.clipboard.writeText(this.group()!.inviteCode);
    this.notify.success('Código copiado al portapapeles');
  }

  saveSettings() {
    const req: UpdateGroupRequest = { name: this.editName };
    this.groupSvc.updateGroup(this.group()!.id, req).subscribe({
      next: g => { this.group.set(g); this.notify.success('Grupo actualizado'); this.settingsOpen.set(false); },
    });
  }

  deleteGroup() {
    this.groupSvc.deleteGroup(this.group()!.id).subscribe({
      next: () => { this.notify.success('Grupo disuelto'); this.router.navigate(['/mis-grupos']); },
    });
  }
}
