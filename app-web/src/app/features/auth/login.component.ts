import {
  Component, OnInit, inject, signal, AfterViewInit, ViewChild, ElementRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { NotificationService } from '../../core/services/notification.service';

type AuthMode = 'google' | 'login' | 'register' | 'forgot' | 'reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Hero zone (65%) -->
      <div class="flex-[0_0_65%] bg-[var(--q-fg)] flex flex-col p-8 relative overflow-hidden">
        <div class="flex items-center gap-2 mb-auto">
          <span class="text-3xl">⚽</span>
          <span class="font-bold font-display text-2xl text-[var(--q-bg)]">TECnoa</span>
        </div>

        <div class="my-auto">
          <p class="text-[var(--q-accent)] text-sm font-semibold tracking-widest uppercase mb-3">
            Mundial 2026
          </p>
          <h1 class="font-display text-[var(--q-bg)] text-5xl md:text-6xl leading-tight mb-10">
            Quien acierta<br>gana.
          </h1>

          <div class="space-y-2 max-w-xs">
            @for (m of fakeMatches; track m.home) {
              <div class="flex items-center gap-3 bg-white/10 rounded-[var(--radius-md)] px-4 py-2">
                <span class="text-[var(--q-bg)] text-sm font-semibold flex-1">{{ m.home }}</span>
                <span class="font-mono font-bold text-[var(--q-accent)] text-base">{{ m.score }}</span>
                <span class="text-[var(--q-bg)] text-sm font-semibold flex-1 text-right">{{ m.away }}</span>
              </div>
            }
          </div>
        </div>

        <div class="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[var(--q-accent)] opacity-10 blur-3xl pointer-events-none"></div>
      </div>

      <!-- Action zone (35%) -->
      <div class="flex-[0_0_35%] bg-[var(--q-bg)] flex flex-col items-center justify-center gap-6 px-6">
        <div class="w-full max-w-xs flex flex-col items-center gap-4">

          <!-- Mode switcher tabs -->
          <div class="flex w-full gap-1 bg-[var(--q-bg-2)] rounded-[var(--radius-md)] p-1">
            <button (click)="setMode('login')"
                    [class.bg-white]="mode() === 'login' || mode() === 'register' || mode() === 'forgot' || mode() === 'reset'"
                    class="flex-1 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors"
                    [class.text-[var(--q-fg)]]="mode() === 'google'"
                    [class.shadow-sm]="mode() !== 'google'">
              Email
            </button>
          </div>

          <!-- Google Auth Section -->
          @if (mode() === 'google') {
            <!-- Google button container -->
            <div #googleBtn class="w-full flex justify-center"></div>

            @if (!googleLoaded()) {
              <button (click)="signInManual()"
                      [disabled]="loading()"
                      class="w-full max-w-xs flex items-center justify-center gap-3 px-6 py-3 rounded-[var(--radius-md)] border-2 border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] font-semibold hover:border-[var(--q-fg)] transition-colors disabled:opacity-50">
                @if (loading()) {
                  <span class="w-5 h-5 border-2 border-[var(--q-fg)] border-t-transparent rounded-full animate-spin"></span>
                } @else {
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                }
                <span>{{ loading() ? 'Iniciando sesión…' : 'Continuar con Google' }}</span>
              </button>
            }

            <p class="text-xs text-[var(--q-fg-3)] text-center">
              Usamos OAuth2 de Google.<br>No almacenamos contraseñas.
            </p>
          }

          <!-- Login Form -->
          @if (mode() === 'login') {
            <div class="w-full flex flex-col gap-3">
              <input [(ngModel)]="loginEmail" type="email" placeholder="Correo electrónico"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <input [(ngModel)]="loginPassword" type="password" placeholder="Contraseña"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <button (click)="submitLogin()" [disabled]="loading() || !loginEmail || !loginPassword"
                      class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {{ loading() ? 'Iniciando sesión…' : 'Iniciar sesión' }}
              </button>
              <button (click)="setMode('forgot')" class="text-xs text-[var(--q-fg-3)] hover:text-[var(--q-fg)] text-center">
                ¿Olvidaste tu contraseña?
              </button>
              <div class="flex items-center gap-2 my-2">
                <div class="flex-1 h-px bg-[var(--q-fg-2)]"></div>
                <span class="text-xs text-[var(--q-fg-3)]">¿No tienes cuenta?</span>
                <div class="flex-1 h-px bg-[var(--q-fg-2)]"></div>
              </div>
              <button (click)="setMode('register')"
                      class="w-full py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--q-fg-2)] text-[var(--q-fg)] font-semibold hover:border-[var(--q-fg)] transition-colors">
                Crear cuenta
              </button>
            </div>
          }

          <!-- Register Form -->
          @if (mode() === 'register') {
            <div class="w-full flex flex-col gap-3">
              <input [(ngModel)]="registerName" type="text" placeholder="Nombre completo"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <input [(ngModel)]="registerEmail" type="email" placeholder="Correo electrónico"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <input [(ngModel)]="registerPassword" type="password" placeholder="Contraseña (min 8 caracteres)"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <input [(ngModel)]="registerConfirmPassword" type="password" placeholder="Confirmar contraseña"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              @if (registerPassword && registerConfirmPassword && registerPassword !== registerConfirmPassword) {
                <p class="text-xs text-red-500 -mt-1">Las contraseñas no coinciden</p>
              }
              <button (click)="submitRegister()" [disabled]="loading() || !registerName || !registerEmail || !registerPassword || !registerConfirmPassword || registerPassword !== registerConfirmPassword"
                      class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {{ loading() ? 'Creando cuenta…' : 'Crear cuenta' }}
              </button>
              <div class="flex items-center gap-2 my-2">
                <div class="flex-1 h-px bg-[var(--q-fg-2)]"></div>
                <span class="text-xs text-[var(--q-fg-3)]">¿Ya tienes cuenta?</span>
                <div class="flex-1 h-px bg-[var(--q-fg-2)]"></div>
              </div>
              <button (click)="setMode('login')"
                      class="w-full py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--q-fg-2)] text-[var(--q-fg)] font-semibold hover:border-[var(--q-fg)] transition-colors">
                Iniciar sesión
              </button>
            </div>
          }

          <!-- Forgot Password Form -->
          @if (mode() === 'forgot') {
            <div class="w-full flex flex-col gap-3 text-center">
              <p class="text-sm text-[var(--q-fg-2)]">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
              <input [(ngModel)]="forgotEmail" type="email" placeholder="Correo electrónico"
                     class="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--q-fg-2)] bg-white text-[var(--q-fg)] placeholder:text-[var(--q-fg-3)] focus:outline-none focus:border-[var(--q-accent)]" />
              <button (click)="submitForgot()" [disabled]="loading() || !forgotEmail"
                      class="w-full py-3 rounded-[var(--radius-md)] bg-[var(--q-accent)] text-[var(--q-fg)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
              </button>
              @if (forgotSent()) {
                <p class="text-sm text-green-600">✅ Revisa tu correo para restablecer tu contraseña.</p>
              }
              <button (click)="setMode('login')" class="text-xs text-[var(--q-fg-3)] hover:text-[var(--q-fg)]">
                Volver al login
              </button>
            </div>
          }

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleBtn') googleBtnRef!: ElementRef<HTMLDivElement>;

  private auth   = inject(AuthService);
  private googleId = inject(GoogleIdentityService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  mode = signal<AuthMode>('login');
  loading = signal(false);
  googleLoaded = signal(false);
  forgotSent = signal(false);

  // Login fields
  loginEmail = '';
  loginPassword = '';

  // Register fields
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';

  // Forgot fields
  forgotEmail = '';

  fakeMatches = [
    { home: 'ARG', score: '2 – 1', away: 'BRA' },
    { home: 'FRA', score: '0 – 0', away: 'ESP' },
    { home: 'ALE', score: '3 – 2', away: 'ING' },
  ];

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.redirect();
      return;
    }
    this.googleId.getCredentialStream().subscribe(idToken => this.handleToken(idToken));
  }

  ngAfterViewInit() {
    if (this.mode() === 'google') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.googleId.initialize();
        this.googleId.renderButton(this.googleBtnRef.nativeElement);
        this.googleLoaded.set(true);
      };
      document.head.appendChild(script);
    }
  }

  setMode(m: AuthMode) {
    this.mode.set(m);
    this.forgotSent.set(false);
    this.clearFields();
    if (m === 'google') {
      setTimeout(() => this.initGoogleButton(), 100);
    }
  }

  private initGoogleButton() {
    const el = this.googleBtnRef?.nativeElement;
    if (!el) return;
    try {
      this.googleId.initialize();
      this.googleId.renderButton(el);
      this.googleLoaded.set(true);
    } catch {}
  }

  signInManual() {
    this.loading.set(true);
    this.googleId.prompt().subscribe({
      next: idToken => this.handleToken(idToken),
      error: () => {
        this.loading.set(false);
        this.notify.error('No se pudo iniciar sesión con Google.');
      },
    });
  }

  submitLogin() {
    this.loading.set(true);
    this.auth.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success('¡Bienvenido de vuelta!');
        this.redirect();
      },
      error: err => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Error al iniciar sesión.';
        this.notify.error(msg);
      },
    });
  }

  submitRegister() {
    this.loading.set(true);
    this.auth.register({ name: this.registerName, email: this.registerEmail, password: this.registerPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.notify.success('¡Cuenta creada! Revisa tu correo para verificar tu cuenta.');
        this.redirect();
      },
      error: err => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Error al crear cuenta.';
        this.notify.error(msg);
      },
    });
  }

  submitForgot() {
    this.loading.set(true);
    this.auth.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.loading.set(false);
        this.forgotSent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('No se pudo procesar tu solicitud.');
      },
    });
  }

  private handleToken(idToken: string) {
    this.loading.set(true);
    this.auth.loginWithGoogle(idToken).subscribe({
      next: () => this.redirect(),
      error: () => {
        this.loading.set(false);
        this.notify.error('Error al iniciar sesión. Intenta de nuevo.');
      },
    });
  }

  private clearFields() {
    this.loginEmail = '';
    this.loginPassword = '';
    this.registerName = '';
    this.registerEmail = '';
    this.registerConfirmPassword = '';
    this.forgotEmail = '';
  }

  private redirect() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/explorar';
    this.router.navigateByUrl(returnUrl);
  }
}