import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from './admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type Tab = 'tournaments' | 'teams' | 'users';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PillComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="max-w-5xl mx-auto p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold font-display text-[var(--q-fg)]">Panel de Administración</h1>
          <p class="text-sm text-[var(--q-fg-2)]">Gestiona torneos, equipos y usuarios</p>
        </div>
      </div>

      <!-- Sync Section -->
      <div class="bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-4 mb-6">
        <h2 class="text-sm font-semibold text-[var(--q-fg)] mb-3">Sincronización</h2>
        <div class="flex flex-wrap gap-2">
          <button (click)="runSync('tournaments')"
                  [disabled]="syncing()"
                  class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-surface-2)] text-[var(--q-fg)] text-sm font-medium hover:bg-[var(--q-surface-3)] transition-colors disabled:opacity-50">
            {{ syncing() === 'tournaments' ? 'Sincronizando...' : '🔄 Torneos' }}
          </button>
          <button (click)="runSync('fixtures')"
                  [disabled]="syncing()"
                  class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-surface-2)] text-[var(--q-fg)] text-sm font-medium hover:bg-[var(--q-surface-3)] transition-colors disabled:opacity-50">
            {{ syncing() === 'fixtures' ? 'Sincronizando...' : '📅 Partidos' }}
          </button>
          <button (click)="runSync('scoring')"
                  [disabled]="syncing()"
                  class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50">
            {{ syncing() === 'scoring' ? 'Calculando...' : '🏆 Scoring' }}
          </button>
          <button (click)="runSync('all')"
                  [disabled]="syncing()"
                  class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-surface-3)] text-[var(--q-fg)] text-sm font-medium hover:bg-[var(--q-surface-3)] transition-colors disabled:opacity-50">
            {{ syncing() === 'all' ? 'Sincronizando todo...' : '⚡ Todo' }}
          </button>
        </div>
        @if (syncResult()) {
          <p class="text-xs mt-2" [class.text-green-400]="syncResult()!.ok" [class.text-red-400]="!syncResult()!.ok">{{ syncResult()!.msg }}</p>
        }
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b border-[var(--q-surface-2)]">
        <button (click)="activeTab.set('tournaments')"
                [class]="tabClass('tournaments')">
          Torneos
        </button>
        <button (click)="activeTab.set('teams')"
                [class]="tabClass('teams')">
          Equipos
        </button>
        <button (click)="activeTab.set('users')"
                [class]="tabClass('users')">
          Usuarios
        </button>
      </div>

      <!-- Tournaments -->
      @if (activeTab() === 'tournaments') {
        <div>
          <div class="flex justify-end mb-4">
            <button (click)="openTournamentForm()" class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">
              + Nuevo Torneo
            </button>
          </div>
          @if (loading()) {
            <div class="space-y-3">@for (i of [1,2,3]; track i) { <app-skeleton height="60px" /> }</div>
          } @else if (tournaments().length === 0) {
            <app-empty-state icon="🏆" title="Sin torneos" description="Crea tu primer torneo" />
          } @else {
            <div class="space-y-3">
              @for (t of tournaments(); track t.id) {
                <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--q-surface-2)] flex items-center justify-center text-xl">🏆</div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-[var(--q-fg)]">{{ t.name }}</p>
                    <p class="text-xs text-[var(--q-fg-3)]">{{ t.type }} · {{ t.status }}</p>
                  </div>
                  <app-pill [label]="t.status" variant="default" />
                  <button (click)="editTournament(t)" class="text-sm text-[var(--q-accent)]">Editar</button>
                  <button (click)="deleteTournament(t.id)" class="text-sm text-red-500">Eliminar</button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Teams -->
      @if (activeTab() === 'teams') {
        <div>
          <div class="flex justify-end mb-4">
            <button (click)="openTeamForm()" class="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">
              + Nuevo Equipo
            </button>
          </div>
          @if (loading()) {
            <div class="space-y-3">@for (i of [1,2,3]; track i) { <app-skeleton height="60px" /> }</div>
          } @else if (teams().length === 0) {
            <app-empty-state icon="👥" title="Sin equipos" description="Crea tu primer equipo" />
          } @else {
            <div class="space-y-3">
              @for (t of teams(); track t.id) {
                <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[var(--q-surface-2)] flex items-center justify-center text-xl">🚩</div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-[var(--q-fg)]">{{ t.name }}</p>
                    <p class="text-xs text-[var(--q-fg-3)]">{{ t.country || 'Sin país' }}</p>
                  </div>
                  <button (click)="editTeam(t)" class="text-sm text-[var(--q-accent)]">Editar</button>
                  <button (click)="deleteTeam(t.id)" class="text-sm text-red-500">Eliminar</button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Users -->
      @if (activeTab() === 'users') {
        <div>
          @if (loading()) {
            <div class="space-y-3">@for (i of [1,3]; track i) { <app-skeleton height="60px" /> }</div>
          } @else if (users().length === 0) {
            <app-empty-state icon="👤" title="Sin usuarios" description="No hay usuarios registrados" />
          } @else {
            <div class="space-y-3">
              @for (u of users(); track u.id) {
                <div class="bg-[var(--q-surface)] rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[var(--q-accent)] flex items-center justify-center text-white font-bold text-sm">
                    {{ u.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-[var(--q-fg)]">{{ u.name }}</p>
                    <p class="text-xs text-[var(--q-fg-3)]">{{ u.email }}</p>
                  </div>
                  <select [(ngModel)]="u.role" (change)="updateRole(u)"
                          class="text-xs px-2 py-1 rounded border border-[var(--q-surface-2)] bg-[var(--q-surface-2)] text-[var(--q-fg)]">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Tournament Modal -->
    @if (showTournamentModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeTournamentModal()"></div>
        <div class="relative bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-6 w-full max-w-md">
          <h3 class="font-bold font-display text-lg text-[var(--q-fg)] mb-4">
            {{ editingTournament() ? 'Editar' : 'Nuevo' }} Torneo
          </h3>
          <div class="space-y-3">
            <input [(ngModel)]="tournamentForm.name" placeholder="Nombre" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <input [(ngModel)]="tournamentForm.shortName" placeholder="Nombre corto" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <select [(ngModel)]="tournamentForm.type" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]">
              <option value="">Tipo...</option>
              <option value="WORLD_CUP">Copa del Mundo</option>
              <option value="CHAMPIONS_LEAGUE">Champions League</option>
              <option value="DOMESTIC_LEAGUE">Liga Nacional</option>
              <option value="CUP">Copa</option>
              <option value="FRIENDLY">Amistoso</option>
            </select>
            <input [(ngModel)]="tournamentForm.season" placeholder="Temporada (ej. 2025-2026)" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-[var(--q-fg-3)] mb-1 block">Inicio</label>
                <input type="date" [(ngModel)]="tournamentForm.startDate" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
              </div>
              <div>
                <label class="text-xs text-[var(--q-fg-3)] mb-1 block">Fin</label>
                <input type="date" [(ngModel)]="tournamentForm.endDate" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm text-[var(--q-fg-2)]">
              <input type="checkbox" [(ngModel)]="tournamentForm.hasPhases" /> Tiene fases/eliminatorias
            </label>
          </div>
          <div class="flex gap-2 mt-4">
            <button (click)="closeTournamentModal()" class="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] text-sm font-medium">Cancelar</button>
            <button (click)="saveTournament()" class="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- Team Modal -->
    @if (showTeamModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeTeamModal()"></div>
        <div class="relative bg-[var(--q-surface)] rounded-[var(--radius-xl)] p-6 w-full max-w-md">
          <h3 class="font-bold font-display text-lg text-[var(--q-fg)] mb-4">
            {{ editingTeam() ? 'Editar' : 'Nuevo' }} Equipo
          </h3>
          <div class="space-y-3">
            <input [(ngModel)]="teamForm.name" placeholder="Nombre" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <input [(ngModel)]="teamForm.shortName" placeholder="Nombre corto" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <select [(ngModel)]="teamForm.tournamentId" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]">
              <option value="">Seleccionar torneo…</option>
              @for (t of tournaments(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
            <input [(ngModel)]="teamForm.country" placeholder="País" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
            <input [(ngModel)]="teamForm.flagUrl" placeholder="URL del logo/banderina" class="w-full px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)]" />
          </div>
          <div class="flex gap-2 mt-4">
            <button (click)="closeTeamModal()" class="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] text-sm font-medium">Cancelar</button>
            <button (click)="saveTeam()" class="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private notify   = inject(NotificationService);

  activeTab  = signal<string>('tournaments');
  loading    = signal(false);
  syncing    = signal<string | null>(null);
  syncResult = signal<{ok: boolean; msg: string} | null>(null);
  tournaments = signal<any[]>([]);
  teams      = signal<any[]>([]);
  users      = signal<any[]>([]);

  showTournamentModal = signal(false);
  editingTournament  = signal<any>(null);
  tournamentForm: any = {};

  showTeamModal = signal(false);
  editingTeam  = signal<any>(null);
  teamForm: any = {};

  ngOnInit() {
    this.loadTournaments();
    this.loadTeams();
    this.loadUsers();
  }

  loadActiveTab() {
    this.loading.set(false);
  }

  loadTournaments() {
    this.adminSvc.getTournaments().subscribe({ next: d => { this.tournaments.set(d); }, error: () => {} });
  }
  loadTeams() {
    this.adminSvc.getTeams().subscribe({ next: d => { this.teams.set(d); }, error: () => {} });
  }
  loadUsers() {
    this.adminSvc.getUsers().subscribe({ next: d => { this.users.set(d); }, error: () => {} });
  }

  tabLabel(t: string) { return { tournaments: 'Torneos', teams: 'Equipos', users: 'Usuarios' }[t] as string; }
  tabClass(t: string) {
    const base = 'pb-3 px-1 text-sm font-medium border-b-2 transition-colors';
    return this.activeTab() === t
      ? `${base} border-[var(--q-accent)] text-[var(--q-accent)]`
      : `${base} border-transparent text-[var(--q-fg-2)] hover:text-[var(--q-fg)]`;
  }

  openTournamentForm() { this.editingTournament.set(null); this.tournamentForm = { hasPhases: false }; this.showTournamentModal.set(true); }
  editTournament(t: any) { this.editingTournament.set(t); this.tournamentForm = { ...t }; this.showTournamentModal.set(true); }
  closeTournamentModal() { this.showTournamentModal.set(false); }
  saveTournament() {
    if (this.editingTournament()) {
      this.adminSvc.updateTournament(this.editingTournament().id, this.tournamentForm).subscribe({ next: () => { this.notify.success('Torneo actualizado'); this.closeTournamentModal(); this.loadTournaments(); }, error: () => this.notify.error('Error al actualizar') });
    } else {
      this.adminSvc.createTournament(this.tournamentForm).subscribe({ next: () => { this.notify.success('Torneo creado'); this.closeTournamentModal(); this.loadTournaments(); }, error: () => this.notify.error('Error al crear') });
    }
  }
  deleteTournament(id: string) {
    if (!confirm('¿Eliminar este torneo?')) return;
    this.adminSvc.deleteTournament(id).subscribe({ next: () => { this.notify.success('Torneo eliminado'); this.loadTournaments(); }, error: () => this.notify.error('Error al eliminar') });
  }

  openTeamForm() { this.editingTeam.set(null); this.teamForm = {}; this.showTeamModal.set(true); }
  editTeam(t: any) { this.editingTeam.set(t); this.teamForm = { ...t }; this.showTeamModal.set(true); }
  closeTeamModal() { this.showTeamModal.set(false); }
  saveTeam() {
    if (this.editingTeam()) {
      this.adminSvc.updateTeam(this.editingTeam().id, this.teamForm).subscribe({ next: () => { this.notify.success('Equipo actualizado'); this.closeTeamModal(); this.loadTeams(); }, error: () => this.notify.error('Error al actualizar') });
    } else {
      this.adminSvc.createTeam(this.teamForm).subscribe({ next: () => { this.notify.success('Equipo creado'); this.closeTeamModal(); this.loadTeams(); }, error: () => this.notify.error('Error al crear') });
    }
  }
  deleteTeam(id: string) {
    if (!confirm('¿Eliminar este equipo?')) return;
    this.adminSvc.deleteTeam(id).subscribe({ next: () => { this.notify.success('Equipo eliminado'); this.loadTeams(); }, error: () => this.notify.error('Error al eliminar') });
  }

  updateRole(user: any) {
    this.adminSvc.updateUserRole(user.id, user.role).subscribe({ next: () => this.notify.success('Rol actualizado'), error: () => this.notify.error('Error al actualizar rol') });
  }

  runSync(type: string) {
    this.syncing.set(type);
    this.syncResult.set(null);
    let obs: any;
    if (type === 'tournaments') obs = this.adminSvc.syncTournaments();
    else if (type === 'fixtures') obs = this.adminSvc.syncFixtures();
    else if (type === 'scoring') obs = this.adminSvc.syncScoring();
    else obs = this.adminSvc.syncAll();
    obs.subscribe({
      next: () => { this.syncing.set(null); this.syncResult.set({ ok: true, msg: `Sincronización ${type} completada` }); },
      error: () => { this.syncing.set(null); this.syncResult.set({ ok: false, msg: `Error en ${type}` }); }
    });
  }
}