import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { GroupService, CreateGroupRequest } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Tournament } from '../../../core/models';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button (click)="router.navigate(['/mis-grupos'])"
                class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">←</button>
        <h1 class="text-xl font-bold font-display text-[var(--q-fg)]">Crear grupo</h1>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 mb-8">
        @for (s of [1,2]; track s) {
          <div class="flex items-center gap-2 flex-1">
            <div [class]="stepDotClass(s)">{{ s }}</div>
            <span class="text-xs font-medium" [class.text-[var(--q-fg)]]="step() >= s" [class.text-[var(--q-fg-3)]]="step() < s">
              {{ s === 1 ? 'Info básica' : 'Configuración' }}
            </span>
            @if (s < 2) {
              <div class="flex-1 h-px bg-[var(--q-surface-2)]"></div>
            }
          </div>
        }
      </div>

      <!-- Step 1 -->
      @if (step() === 1) {
        <form [formGroup]="step1Form" class="space-y-4">
          <div>
            <label class="label">Nombre del grupo</label>
            <input formControlName="name" type="text" maxlength="50"
                   class="field" placeholder="Ej. Amigos del Mundial">
            <div class="text-right text-xs text-[var(--q-fg-3)] mt-1">
              {{ step1Form.get('name')?.value?.length || 0 }}/50
            </div>
            @if (step1Form.get('name')?.invalid && step1Form.get('name')?.touched) {
              <p class="text-xs text-[var(--q-danger)] mt-1">El nombre es obligatorio (mín. 3 caracteres).</p>
            }
          </div>

          <div>
            <label class="label">Torneo</label>
            <select formControlName="tournamentId" class="field">
              <option value="">Seleccionar torneo…</option>
              @for (t of tournaments(); track t.id) {
                <option [value]="t.id">{{ t.name }} {{ t.season }}</option>
              }
            </select>
            @if (step1Form.get('tournamentId')?.invalid && step1Form.get('tournamentId')?.touched) {
              <p class="text-xs text-[var(--q-danger)] mt-1">Selecciona un torneo.</p>
            }
          </div>

          <div>
            <label class="label">Máximo de participantes (opcional)</label>
            <input formControlName="maxParticipants" type="number" min="2" max="500"
                   class="field" placeholder="Sin límite">
          </div>

          <div class="flex items-center justify-between p-3 bg-[var(--q-surface-2)] rounded-[var(--radius-md)]">
            <div>
              <p class="text-sm font-medium text-[var(--q-fg)]">Grupo abierto</p>
              <p class="text-xs text-[var(--q-fg-3)]">Cualquiera con el enlace puede unirse</p>
            </div>
            <button type="button" (click)="toggleOpen()"
                    [class]="step1Form.get('isOpen')?.value ? 'bg-[var(--q-accent)]' : 'bg-[var(--q-fg-3)]'"
                    class="w-12 h-6 rounded-full transition-colors relative">
              <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    [class.left-0.5]="!step1Form.get('isOpen')?.value"
                    [class.left-6]="step1Form.get('isOpen')?.value"></span>
            </button>
          </div>

          <div>
            <label class="label">Contraseña (opcional)</label>
            <div class="relative">
              <input formControlName="password" [type]="showPassword ? 'text' : 'password'"
                     class="field pr-10" placeholder="Sin contraseña">
              <button type="button" (click)="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--q-fg-3)]">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button type="button" (click)="nextStep()"
                  class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold">
            Siguiente →
          </button>
        </form>
      }

      <!-- Step 2 -->
      @if (step() === 2) {
        <form [formGroup]="step2Form" class="space-y-5">
          <div>
            <label class="label">Cierre antes del partido</label>
            <div class="flex items-center gap-4">
              <input formControlName="deadlineMinutes" type="range" min="5" max="120" step="5" class="flex-1">
              <span class="text-sm font-bold text-[var(--q-fg)] w-16 text-right">
                {{ step2Form.get('deadlineMinutes')?.value }} min
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-[var(--q-surface-2)] rounded-[var(--radius-md)]">
            <div>
              <p class="text-sm font-medium text-[var(--q-fg)]">Habilitar comodines</p>
              <p class="text-xs text-[var(--q-fg-3)]">Finalistas, goleador, MVP, mejor portero</p>
            </div>
            <button type="button" (click)="toggleWildcards()"
                    [class]="step2Form.get('wildcardsEnabled')?.value ? 'bg-[var(--q-accent)]' : 'bg-[var(--q-fg-3)]'"
                    class="w-12 h-6 rounded-full transition-colors relative">
              <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    [class.left-0.5]="!step2Form.get('wildcardsEnabled')?.value"
                    [class.left-6]="step2Form.get('wildcardsEnabled')?.value"></span>
            </button>
          </div>

          <div>
            <label class="label">Monto de inscripción (informativo)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--q-fg-3)]">Bs</span>
              <input formControlName="entryFee" type="number" min="0" step="0.5"
                     class="field pl-9" placeholder="0.00">
            </div>
          </div>

          <div class="flex gap-3">
            <button type="button" (click)="step.set(1)"
                    class="flex-1 py-3 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] text-[var(--q-fg)] font-medium">
              ← Anterior
            </button>
            <button type="button" (click)="submit()" [disabled]="loading()"
                    class="flex-1 py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold disabled:opacity-50">
              {{ loading() ? 'Creando…' : 'Crear grupo' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .label { @apply block text-sm font-medium text-[var(--q-fg)] mb-1.5; }
    .field {
      @apply w-full px-4 py-2.5 bg-[var(--q-surface-2)] border border-transparent rounded-[var(--radius-md)]
             text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)]
             focus:outline-none focus:border-[var(--q-accent)];
    }
  `],
})
export class CreateGroupComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private tournamentSvc = inject(TournamentService);
  private groupSvc = inject(GroupService);
  private notify = inject(NotificationService);
  router = inject(Router);

  step         = signal(1);
  loading      = signal(false);
  tournaments  = signal<Tournament[]>([]);
  showPassword = false;

  step1Form = this.fb.group({
    name:          ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    tournamentId:  ['', Validators.required],
    maxParticipants: [null as number | null],
    isOpen:        [true],
    password:      [''],
  });

  step2Form = this.fb.group({
    deadlineMinutes: [15],
    wildcardsEnabled: [false],
    entryFee: [null as number | null],
  });

  ngOnInit() {
    this.tournamentSvc.getTournaments({ status: ['SCHEDULED', 'IN_PROGRESS'], size: 50 }).subscribe({
      next: page => this.tournaments.set(page.content),
    });
  }

  toggleOpen()      { const c = this.step1Form.get('isOpen')!; c.setValue(!c.value); }
  toggleWildcards() { const c = this.step2Form.get('wildcardsEnabled')!; c.setValue(!c.value); }

  nextStep() {
    this.step1Form.markAllAsTouched();
    if (this.step1Form.valid) this.step.set(2);
  }

  submit() {
    this.loading.set(true);
    const v1 = this.step1Form.value;
    const v2 = this.step2Form.value;
    const req: CreateGroupRequest = {
      name:                     v1.name!,
      tournamentId:             v1.tournamentId!,
      maxParticipants:          v1.maxParticipants || undefined,
      isOpen:                   v1.isOpen!,
      password:                 v1.password || undefined,
      predictionDeadlineMinutes: v2.deadlineMinutes!,
      wildcardsEnabled:         v2.wildcardsEnabled!,
      entryFee:                 v2.entryFee || undefined,
    };
    this.groupSvc.createGroup(req).subscribe({
      next: group => {
        this.notify.success('¡Grupo creado!');
        this.router.navigate(['/grupos', group.id]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  stepDotClass(s: number) {
    const base = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0';
    return s <= this.step()
      ? `${base} bg-[var(--q-accent)] text-[var(--q-fg)]`
      : `${base} bg-[var(--q-surface-2)] text-[var(--q-fg-3)]`;
  }
}
