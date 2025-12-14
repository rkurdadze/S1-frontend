import {ApplicationConfig, InjectionToken, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch} from '@angular/common/http';
import {environment} from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideRouter(routes, withHashLocation()),
    // provideClientHydration(),
    provideHttpClient(withFetch()),
  ],
};


export const BASE_API_URL = new InjectionToken<string>('BaseApiUrl', {
  providedIn: 'root',
  factory: () => environment.baseApiUrl
});