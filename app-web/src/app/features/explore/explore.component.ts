import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { GroupService, JoinGroupRequest } from '../../core/services/group.service';
import { NotificationService } from '../../core/services/notification.service';
import { Tournament, BettingGroup, TOURNAMENT_TYPE_LABEL } from '../../core/models';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { CurrencyBsPipe } from '../../shared/pipes/currency-bs.pipe';

type FilterChip = 'all' | 'cups' | 'leagues' | 'private' | 'upcoming';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PillComponent, SkeletonComponent, EmptyStateComponent,
    InfiniteScrollDirective, CurrencyBsPipe,
  ],
  template: `
    <div class="p-4 md:p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold font-display text-[var(--q-fg)]">Explorar</h1>
          <p class="text-sm text-[var(--q-fg-2)]">Torneos abiertos a inscripción</p>
        </div>
        <button class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)] text-xl">🔔</button>
      </div>

      <!-- Search -->
      <div class="relative mb-4">
        <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
               type="search" placeholder="Buscar torneo u organizador… (Ctrl+K)"
               class="w-full pl-10 pr-4 py-2.5 bg-[var(--q-surface)] border border-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--q-fg-3)]">🔍</span>
      </div>

      <!-- Filter chips -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        @for (chip of chips; track chip.id) {
          <button (click)="activeChip.set(chip.id)"
                  [class]="chipClass(chip.id)">
            {{ chip.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 space-y-2">
              <app-skeleton height="20px" width="60%" />
              <app-skeleton height="14px" width="80%" />
            </div>
          }
        </div>
      } @else if (groups().length === 0) {
        <app-empty-state icon="🏆" title="Sin torneos disponibles"
                         description="No hay torneos abiertos en este momento."
                         ctaLabel="Crear un grupo" (ctaClick)="router.navigate(['/mis-grupos/crear'])" />
      } @else {
        <!-- Featured group (first) -->
        @if (groups()[0]; as featured) {
          <div class="bg-[var(--q-fg)] rounded-[var(--radius-xl)] p-5 mb-6">
            <div class="flex items-start justify-between mb-3">
              <app-pill label="🔥 Destacado" variant="accent" />
            </div>
            <h2 class="text-[var(--q-bg)] font-bold font-display text-2xl mb-1">{{ featured.name }}</h2>
            <p class="text-[var(--q-fg-3)] text-sm mb-4">
              {{ typeLabel(featured.tournament.type) }} · Por {{ featured.organizerName || 'Organizador' }}
            </p>
            <div class="flex gap-4 text-xs text-[var(--q-fg-3)] mb-5">
              <span>💰 {{ featured.entryFee | currencyBs }}</span>
              <span>👥 {{ featured.totalParticipants }} jugadores</span>
            </div>
            <button (click)="openJoinDialog(featured)"
                    class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold">
              Inscribirme · {{ featured.entryFee | currencyBs }}
            </button>
          </div>
        }

        <!-- Group list -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          @for (group of groups().slice(1); track group.id) {
            <div (click)="openJoinDialog(group)"
                 class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 cursor-pointer hover:border-[var(--q-accent)] border border-[var(--q-surface-2)] transition-colors flex items-center gap-3">
              <div class="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--q-surface-2)] flex items-center justify-center text-2xl shrink-0">🏆</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-sm font-semibold text-[var(--q-fg)] truncate">{{ group.name }}</span>
                  @if (group.status === 'ACTIVE') { <app-pill label="Inscrito" variant="success" /> }
                </div>
                <p class="text-xs text-[var(--q-fg-3)] truncate">
                  {{ typeLabel(group.tournament.type) }} · {{ group.totalParticipants }} jugadores · {{ group.entryFee | currencyBs }}
                </p>
              </div>
              <span class="text-[var(--q-fg-3)]">›</span>
            </div>
          }
        </div>

        <!-- Infinite scroll trigger -->
        @if (hasMore()) {
          <div appInfiniteScroll (scrolled)="loadMore()" class="h-10 flex items-center justify-center">
            <span class="text-xs text-[var(--q-fg-3)]">Cargando más…</span>
          </div>
        }
      }
    </div>

    <!-- Join dialog -->
    @if (joinDialogGroup()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" (click)="closeJoinDialog()">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-6 w-full max-w-sm"
             (click)="$event.stopPropagation()">
          <h3 class="font-bold font-display text-lg text-[var(--q-fg)] mb-1">{{ joinDialogGroup()!.name }}</h3>
          <p class="text-sm text-[var(--q-fg-2)] mb-4">
            {{ typeLabel(joinDialogGroup()!.tournament.type) }} · {{ joinDialogGroup()!.totalParticipants }} jugadores
          </p>

          <div class="space-y-3 mb-4">
            <input [(ngModel)]="joinCode" type="text" placeholder="Código de invitación (opcional)"
                   class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
            @if (false) {<!-- password field shown only when group requires it -->
              <input [(ngModel)]="joinPassword" type="password" placeholder="Contraseña del grupo"
                     class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
            }
          </div>

          <div class="flex gap-2">
            <button (click)="closeJoinDialog()" class="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] text-sm font-medium text-[var(--q-fg)]">
              Cancelar
            </button>
            <button (click)="joinGroup()" [disabled]="joinLoading()"
                    class="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm disabled:opacity-50">
              {{ joinLoading() ? 'Uniéndose…' : 'Unirme' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ExploreComponent implements OnInit {
  private tournamentSvc = inject(TournamentService);
  private groupSvc      = inject(GroupService);
  private notify        = inject(NotificationService);
  router = inject(Router);

  loading     = signal(true);
  groups      = signal<BettingGroup[]>([]);
  hasMore     = signal(false);
  activeChip  = signal<FilterChip>('all');
  searchQuery = '';
  currentPage = 0;

  joinDialogGroup = signal<BettingGroup | null>(null);
  joinCode     = '';
  joinPassword = '';
  joinLoading  = signal(false);

  private search$ = new Subject<string>();

  chips = [
    { id: 'all' as FilterChip,      label: 'Todos' },
    { id: 'cups' as FilterChip,     label: 'Selecciones' },
    { id: 'leagues' as FilterChip,  label: 'Ligas' },
    { id: 'private' as FilterChip,  label: 'Privados' },
    { id: 'upcoming' as FilterChip, label: 'Próximos' },
  ];

  ngOnInit() {
    this.loadGroups();
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => { this.currentPage = 0; this.loadGroups(); });
  }

  loadGroups(append = false) {
    this.loading.set(true);
    this.groupSvc.getExploreGroups().subscribe({
      next: data => {
        this.groupSvc.getMyGroups().subscribe({
          next: myGroups => {
            const myGroupIds = new Set(myGroups.map(g => g.id));
            const filtered = data.filter(g => !myGroupIds.has(g.id));
            this.groups.set(append ? [...this.groups(), ...filtered] : filtered);
            this.hasMore.set(filtered.length === 20);
            this.loading.set(false);
          },
          error: () => {
            this.groups.set(append ? [...this.groups(), ...data] : data);
            this.hasMore.set(data.length === 20);
            this.loading.set(false);
          },
        });
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() { this.currentPage++; this.loadGroups(true); }
  onSearch(v: string) { this.search$.next(v); }

  openJoinDialog(group: BettingGroup) { this.joinDialogGroup.set(group); this.joinCode = ''; this.joinPassword = ''; }
  closeJoinDialog() { this.joinDialogGroup.set(null); }

  joinGroup() {
    const group = this.joinDialogGroup();
    if (!group) return;
    this.joinLoading.set(true);
    const req: JoinGroupRequest = { inviteCode: this.joinCode || group.inviteCode };
    if (this.joinPassword) req.password = this.joinPassword;
    this.groupSvc.joinGroup(req).subscribe({
      next: () => {
        this.notify.success('¡Te uniste al grupo!');
        this.closeJoinDialog();
        this.router.navigate(['/grupos', group.id]);
        this.joinLoading.set(false);
      },
      error: () => this.joinLoading.set(false),
    });
  }

  typeLabel(type: string) { return TOURNAMENT_TYPE_LABEL[type as keyof typeof TOURNAMENT_TYPE_LABEL] || type; }

  chipClass(id: FilterChip) {
    const base = 'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap';
    return id === this.activeChip()
      ? `${base} bg-[var(--q-accent)] text-[var(--q-fg)]`
      : `${base} bg-[var(--q-surface)] text-[var(--q-fg-2)] hover:bg-[var(--q-surface-2)]`;
  }
}
