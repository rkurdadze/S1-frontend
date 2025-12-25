import { Component, AfterViewInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

export interface MapAddress {
  country: string;
  region: string;
  city: string;
  municipality?: string;
  lat: number;
  lng: number;
  display_name: string;
}

@Component({
  selector: 'app-address-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-map.component.html',
  styleUrl: './address-map.component.scss'
})
export class AddressMapComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private map?: L.Map;
  private marker?: L.Marker;

  @Output() addressSelected = new EventEmitter<MapAddress>();

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Default to Georgia
    const initialLat = 41.7151;
    const initialLng = 44.8271;

    this.map = L.map('address-map-container').setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    // Fix for Leaflet default icon paths in Angular/Webpack
    const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  private setMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ka`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.address) {
          const addr = res.address;
          
          // Construct a cleaner street address
          const streetParts = [];
          if (addr.road) streetParts.push(addr.road);
          if (addr.house_number) streetParts.push(addr.house_number);
          const cleanStreet = streetParts.join(', ');

          const mappedAddress: MapAddress = {
            country: addr.country || '',
            region: addr.state || addr.region || '',
            municipality: addr.municipality || addr.county || addr.city_district || addr.district || '',
            city: addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '',
            lat,
            lng,
            display_name: cleanStreet || res.display_name
          };
          this.addressSelected.emit(mappedAddress);
        }
      },
      error: (err) => console.error('Geocoding error:', err)
    });
  }
}
