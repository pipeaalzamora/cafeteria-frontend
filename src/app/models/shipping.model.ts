export interface ShippingQuoteRequest {
  originComuna: string;
  destinationComuna: string;
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  declaredValue: number;
}

export interface ShippingOption {
  courier: string;
  service: string;
  price: number;
  estimatedDays: number;
  currency: string;
}

export interface ShippingQuoteResponse {
  options: ShippingOption[];
}
