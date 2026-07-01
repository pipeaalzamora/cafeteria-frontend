import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GoogleMapsLoader } from '../../services/google-maps-loader';

declare const google: any;

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [],
  templateUrl: './address-autocomplete.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address-autocomplete.css'
})
export class AddressAutocompleteComponent implements AfterViewInit, OnDestroy {
  @Input() value = '';
  @Input() placeholder = 'Dirección de entrega';

  @Output() addressSelected = new EventEmitter<string>();
  @Output() addressChange = new EventEmitter<string>();

  @ViewChild('addressInput', { static: true })
  addressInput!: ElementRef<HTMLInputElement>;

  private autocomplete: any | null = null;
  private placeListener: any | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private mapsLoader: GoogleMapsLoader
  ) {}

  ngAfterViewInit(): void {
    // Solo intentamos inicializar Google Maps en el navegador.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.mapsLoader
      .load()
      .then(() => this.initAutocomplete())
      .catch((error) => {
        // No rompemos el checkout: el input sigue funcionando manualmente.
        console.warn(
          'Autocompletado de direcciones no disponible:',
          error?.message ?? error
        );
      });
  }

  private initAutocomplete(): void {
    if (typeof google === 'undefined' || !google.maps?.places) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      {
        componentRestrictions: { country: 'cl' },
        fields: ['formatted_address']
      }
    );

    this.placeListener = this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      const formatted: string = place?.formatted_address ?? '';

      if (formatted) {
        this.value = formatted;
        this.addressSelected.emit(formatted);
        this.addressChange.emit(formatted);
      }
    });
  }

  onInput(value: string): void {
    this.value = value;
    this.addressChange.emit(value);
  }

  ngOnDestroy(): void {
    if (
      this.placeListener &&
      typeof google !== 'undefined' &&
      google.maps?.event
    ) {
      google.maps.event.removeListener(this.placeListener);
    }
    this.placeListener = null;
    this.autocomplete = null;
  }
}
