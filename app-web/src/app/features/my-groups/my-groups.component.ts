import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { BettingGroup, GroupStatus, TOURNAMENT_TYPE_LABEL } from '../../core/models';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CurrencyBsPipe } from '../../shared/pipes/currency-bs.pipe';

type Tab = 'active' | 'upcoming' | 'finished';

@Component({
  selector: 'app-my-groups',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    PillComponent, StatCardComponent, ProgressBarComponent,
    SkeletonComponent, EmptyStateComponent, CurrencyBsPipe,
  ],
  template: `
    <div class="p-4 md:p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold font-display text-[var(--q-fg)]">Mis torneos</h1>
          <p class="text-sm text-[var(--q-fg-2)]">{{ activeCount() }} activos</p>
        </div>
        <button (click)="router.navigate(['/mis-grupos/crear'])"
                class="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">
          + Crear
        </button>
      </div>

      <!-- Stats strip -->
      <div class="grid grid-cols-3 gap-3 mb-5">
        <app-stat-card label="Pos. media" [value]="avgPosition()" suffix="°" />
        <app-stat-card label="Aciertos" [value]="totalCorrect()" />
        <app-stat-card label="Exactos" [value]="totalExact()" />
      </div>

      <!-- Segment tabs -->
      <div class="flex gap-1 bg-[var(--q-surface-2)] p-1 rounded-[var(--radius-md)] mb-5">
        @for (t of tabs; track t.id) {
          <button (click)="activeTab.set(t.id)"
                  [class]="tabClass(t.id)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4">
              <app-skeleton height="20px" width="50%" />
              <div class="mt-2"><app-skeleton height="12px" width="70%" /></div>
            </div>
          }
        </div>
      } @else if (filteredGroups().length === 0) {
        <app-empty-state icon="🏆" title="Sin grupos en esta sección"
                         description="Crea un grupo o únete a uno existente."
                         ctaLabel="Explorar torneos" (ctaClick)="router.navigate(['/explorar'])" />
      } @else {
        <!-- Organized groups -->
        @if (organizedGroups().length > 0) {
          <div class="mb-6">
            <h3 class="text-xs text-[var(--q-fg-3)] font-semibold uppercase tracking-wide mb-3">
              Grupos que creé
            </h3>
            <div class="space-y-3">
              @for (g of organizedGroups(); track g.id) {
                <ng-container *ngTemplateOutlet="groupCard; context: { $implicit: g, organizer: true }" />
              }
            </div>
          </div>
        }

        <!-- Participant groups -->
        @if (participantGroups().length > 0) {
          <div>
            <h3 class="text-xs text-[var(--q-fg-3)] font-semibold uppercase tracking-wide mb-3">
              Grupos en los que participo
            </h3>
            <div class="space-y-3">
              @for (g of participantGroups(); track g.id) {
                <ng-container *ngTemplateOutlet="groupCard; context: { $implicit: g, organizer: false }" />
              }
            </div>
          </div>
        }
      }
    </div>

    <!-- Group card template -->
    <ng-template #groupCard let-g let-isOrganizer="organizer">
      <div (click)="router.navigate(['/grupos', g.id])"
           class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 cursor-pointer hover:border-[var(--q-accent)] border border-[var(--q-surface-2)] transition-all">
        <!-- Pills row -->
        <div class="flex items-center gap-2 mb-2">
          <app-pill [label]="typeLabel(g.tournament.type)" variant="default" />
          @if (g.tournament.status === 'IN_PROGRESS') {
            <app-pill label="EN VIVO" variant="live" />
          }
          @if (isOrganizer) {
            <app-pill label="Organizador" variant="organizer" />
          }
        </div>

        <!-- Name + phase -->
        <h3 class="font-bold text-[var(--q-fg)] text-base mb-0.5">{{ g.name }}</h3>
        <p class="text-xs text-[var(--q-fg-3)] mb-3">{{ g.tournament.name }}</p>

        <!-- Stats -->
        <div class="flex items-center gap-4 mb-3">
          <div>
            <span class="text-2xl font-bold font-display text-[var(--q-accent)]">
              {{ g.myPosition ? (g.myPosition + '°') : '—' }}
            </span>
            <span class="text-xs text-[var(--q-fg-3)] ml-1">pos.</span>
          </div>
          <div class="w-px h-6 bg-[var(--q-surface-2)]"></div>
          <div>
            <span class="text-xl font-bold font-display text-[var(--q-fg)]">{{ g.myPoints ?? 0 }}</span>
            <span class="text-xs text-[var(--q-fg-3)] ml-1">pts</span>
          </div>
          <div class="flex-1 text-right text-xs text-[var(--q-fg-3)]">
            {{ g.totalParticipants }} jugadores · {{ g.entryFee | currencyBs }}
          </div>
        </div>

        <app-progress-bar [value]="60" [max]="100" />
      </div>
    </ng-template>
  `,
})
export class MyGroupsComponent implements OnInit {
  private groupSvc = inject(GroupService);
  router = inject(Router);

  loading    = signal(true);
  groups     = signal<BettingGroup[]>([]);
  activeTab  = signal<Tab>('active');
  tabs = [
    { id: 'active' as Tab,    label: 'Activos' },
    { id: 'upcoming' as Tab,  label: 'Próximos' },
    { id: 'finished' as Tab,  label: 'Finalizados' },
  ];

  filteredGroups = computed(() => {
    const map: Record<Tab, GroupStatus[]> = {
      active:   ['ACTIVE', 'OPEN'],
      upcoming: ['OPEN'],
      finished: ['FINISHED', 'CANCELLED'],
    };
    return this.groups().filter(g => map[this.activeTab()].includes(g.status));
  });

  organizedGroups  = computed(() => this.filteredGroups());
  participantGroups = computed(() => this.filteredGroups().filter(g => g.organizerId !== 'me'));
  activeCount      = computed(() => this.groups().filter(g => g.status === 'ACTIVE').length);
  avgPosition      = computed(() => {
    const pos = this.groups().map(g => g.myPosition).filter(Boolean) as number[];
    if (!pos.length) return '—';
    return Math.round(pos.reduce((a, b) => a + b, 0) / pos.length);
  });
  totalCorrect = computed(() => this.groups().reduce((s, g) => s + (g.myCorrectPredictions ?? 0), 0));
  totalExact   = computed(() => this.groups().reduce((s, g) => s + (g.myExactPredictions ?? 0), 0));

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe({
      next: data => { this.groups.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(type: string) { return TOURNAMENT_TYPE_LABEL[type as keyof typeof TOURNAMENT_TYPE_LABEL] || type; }

  tabClass(id: Tab) {
    const base = 'flex-1 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors';
    return id === this.activeTab()
      ? `${base} bg-[var(--q-surface)] text-[var(--q-fg)] shadow-sm`
      : `${base} text-[var(--q-fg-2)] hover:text-[var(--q-fg)]`;
  }
}
