import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShippingQuoteRequest, ShippingQuoteResponse } from '../models/shipping.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private apiUrl = `${environment.apiUrl}/shipping`;

  constructor(private http: HttpClient) {}

  quote(request: ShippingQuoteRequest): Observable<ShippingQuoteResponse> {
    return this.http.post<ShippingQuoteResponse>(`${this.apiUrl}/quote`, request);
  }
}
