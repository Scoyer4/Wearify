export type ShippingType = 'standard' | 'express';

export interface ShippingOption {
  type: ShippingType;
  label: string;
  price: number;
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CheckoutProduct {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

export interface CheckoutSummary {
  product: CheckoutProduct;
  shippingOptions: ShippingOption[];
  savedAddress: ShippingAddress | null;
}

export interface CreateCheckoutOrderDTO {
  productId: string;
  shippingAddress: ShippingAddress;
  shippingType: ShippingType;
  saveAddress: boolean;
  offerPrice?: number;
}

export interface OrderConfirmation {
  orderId: string;
  finalPrice: number;
  shippingCost: number;
}

export interface StripeSessionInfo {
  orderId:         string | null;
  productTitle:    string;
  productImage:    string | null;
  shippingAddress: ShippingAddress;
  shippingType:    ShippingType;
  productPrice:    number;
  shippingCost:    number;
  totalAmount:     number;
}
