import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    timeout(15_000),
    catchError((err: HttpErrorResponse | Error) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          localStorage.removeItem('tecnoa_auth_token');
          localStorage.removeItem('tecnoa_auth_user');
          router.navigate(['/login']);
        } else if (err.status === 403 && err.error?.error === 'PROFILE_INCOMPLETE') {
          router.navigate(['/perfil/editar'], { queryParams: { reason: 'profile_incomplete' } });
        } else if (err.status === 409 && err.error?.error === 'PREDICTION_DEADLINE_PASSED') {
          notify.error('El tiempo para ingresar pronósticos ha expirado.');
        } else if (err.status === 409 && err.error?.error === 'GROUP_FULL') {
          notify.error('El grupo ha alcanzado el máximo de participantes.');
        } else if (err.status === 409 && err.error?.error === 'ALREADY_MEMBER') {
          notify.error('Ya eres miembro de este grupo.');
        } else if (err.status === 0) {
          notify.error('Sin conexión · Verifica tu red.');
        }
      } else {
        notify.error('Tiempo de espera agotado. Inténtalo de nuevo.');
      }
      return throwError(() => err);
    }),
  );
};
