import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoader {
  private loadPromise: Promise<void> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  load(): Promise<void> {
    // En el servidor (SSR) no cargamos nada y resolvemos de inmediato.
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    // Si ya está cargado en la ventana, resolvemos directamente.
    if (window.google && window.google.maps && window.google.maps.places) {
      return Promise.resolve();
    }

    // Cacheamos la promesa para insertar el <script> una sola vez.
    if (this.loadPromise) {
      return this.loadPromise;
    }

    const apiKey = environment.googleMapsApiKey;

    if (!apiKey) {
      // Sin key no rompemos la app: rechazamos de forma controlada.
      this.loadPromise = Promise.reject(
        new Error(
          'googleMapsApiKey no configurada en environment. ' +
            'El autocompletado de direcciones está deshabilitado.'
        )
      );
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps-loader]'
      );

      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('No se pudo cargar Google Maps JS API.'))
        );
        return;
      }

      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: apiKey,
        libraries: 'places',
        loading: 'async'
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps-loader', 'true');

      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps se cargó pero google.maps no está disponible.'));
        }
      };
      script.onerror = () =>
        reject(new Error('No se pudo cargar Google Maps JS API.'));

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
