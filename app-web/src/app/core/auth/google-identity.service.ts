import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private zone = inject(NgZone);
  private credential$ = new Subject<string>();

  initialize(): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.zone.run(() => this.credential$.next(response.credential));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  prompt(): Observable<string> {
    if (typeof google !== 'undefined') {
      google.accounts.id.prompt();
    }
    return this.credential$.asObservable();
  }

  renderButton(element: HTMLElement): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320,
    });
  }

  revoke(email: string): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.revoke(email, () => {});
    }
  }

  getCredentialStream(): Observable<string> {
    return this.credential$.asObservable();
  }
}
