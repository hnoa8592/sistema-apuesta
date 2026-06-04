import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, UpdateProfileRequest } from '../../../core/services/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PillComponent } from '../../../shared/components/pill/pill.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PillComponent],
  template: `
    <div class="p-4 md:p-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button (click)="router.navigate(['/perfil'])"
                class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--q-surface-2)]">←</button>
        <h1 class="text-xl font-bold font-display text-[var(--q-fg)]">Editar perfil</h1>
      </div>

      @if (reason()) {
        <div class="bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] p-3 mb-5">
          <p class="text-sm text-amber-800">
            ⚠️ Debes verificar tu correo de contacto para crear grupos.
          </p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-5">
        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-[var(--q-fg)] mb-1.5">Teléfono</label>
          <div class="flex gap-2">
            <select formControlName="phonePrefix"
                    class="w-20 px-3 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
              <option>+591</option><option>+54</option><option>+56</option>
              <option>+57</option><option>+51</option><option>+52</option>
            </select>
            <input formControlName="phone" type="tel" placeholder="77712345"
                   class="flex-1 px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:ring-2 ring-[var(--q-accent)]">
          </div>
        </div>

        <!-- Contact email -->
        <div>
          <label class="block text-sm font-medium text-[var(--q-fg)] mb-1.5">
            Correo de verificación
            @if (auth.user()?.emailVerified) {
              <app-pill label="✓ Verificado" variant="success" />
            }
          </label>
          <div class="flex gap-2">
            <input formControlName="contactEmail" type="email" placeholder="tu@correo.com"
                   [disabled]="!!auth.user()?.emailVerified"
                   class="flex-1 px-4 py-2.5 bg-[var(--q-surface-2)] rounded-[var(--radius-md)] text-sm text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:ring-2 ring-[var(--q-accent)] disabled:opacity-50">
            @if (!auth.user()?.emailVerified) {
              <button type="button" (click)="sendVerification()" [disabled]="sendingVerification()"
                      class="px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold text-sm disabled:opacity-50 whitespace-nowrap">
                {{ sendingVerification() ? '…' : 'Enviar enlace' }}
              </button>
            }
          </div>
          @if (verificationSent()) {
            <p class="text-xs text-[var(--q-fg-2)] mt-1.5">
              📧 Revisa tu bandeja · El enlace expira en 24 horas.
            </p>
          }
        </div>

        <button type="submit" [disabled]="loading()"
                class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-semibold disabled:opacity-50">
          {{ loading() ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>
    </div>
  `,
})
export class EditProfileComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private userSvc = inject(UserService);
  private notify  = inject(NotificationService);
  auth    = inject(AuthService);
  router  = inject(Router);
  route   = inject(ActivatedRoute);

  loading              = signal(false);
  sendingVerification  = signal(false);
  verificationSent     = signal(false);
  reason               = signal('');

  form = this.fb.group({
    phonePrefix:  ['+591'],
    phone:        [''],
    contactEmail: ['', Validators.email],
  });

  ngOnInit() {
    const user = this.auth.user();
    if (user?.phone) this.form.patchValue({ phone: user.phone });
    if (user?.contactEmail) this.form.patchValue({ contactEmail: user.contactEmail });
    this.reason.set(this.route.snapshot.queryParamMap.get('reason') || '');

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.auth.refreshProfile();
    });
  }

  save() {
    this.loading.set(true);
    const v = this.form.value;
    const req: UpdateProfileRequest = {
      phone: v.phone ? `${v.phonePrefix} ${v.phone}` : undefined,
      contactEmail: v.contactEmail || undefined,
    };
    this.userSvc.updateProfile(req).subscribe({
      next: user => {
        this.auth['_user'].set(user);
        this.notify.success('Perfil actualizado');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sendVerification() {
    this.sendingVerification.set(true);
    this.userSvc.sendVerificationEmail().subscribe({
      next: () => {
        this.verificationSent.set(true);
        this.notify.success('Enlace de verificación enviado');
        this.sendingVerification.set(false);
      },
      error: () => this.sendingVerification.set(false),
    });
  }
}
