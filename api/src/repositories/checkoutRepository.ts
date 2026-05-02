import supabase from '../config/db';
import { ShippingAddress, CreateCheckoutOrderDTO, OrderConfirmation } from '../models/checkout';

export const checkoutRepository = {

  findProductForCheckout: async (productId: string): Promise<{
    id: string;
    title: string;
    price: number;
    seller_id: string;
    is_sold: boolean;
    image_url: string | null;
  } | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, seller_id, is_sold, productImages(image_url)')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const images = (data as any).productImages ?? [];
    return {
      id:        data.id,
      title:     data.title,
      price:     data.price,
      seller_id: data.seller_id,
      is_sold:   data.is_sold ?? false,
      image_url: images[0]?.image_url ?? null,
    };
  },

  findSavedAddress: async (userId: string): Promise<ShippingAddress | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.shipping_name) return null;
    return {
      name:       data.shipping_name,
      address:    data.shipping_address    ?? '',
      city:       data.shipping_city       ?? '',
      postalCode: data.shipping_postal_code ?? '',
      country:    data.shipping_country    ?? 'España',
    };
  },

  createOrder: async (
    dto: CreateCheckoutOrderDTO,
    buyerId: string,
    sellerId: string,
    productPrice: number,
    shippingCost: number,
  ): Promise<OrderConfirmation> => {
    const finalPrice = productPrice + shippingCost;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        buyer_id:             buyerId,
        seller_id:            sellerId,
        product_id:           dto.productId,
        price_at_purchase:    productPrice,
        shipping_name:        dto.shippingAddress.name,
        shipping_address:     dto.shippingAddress.address,
        shipping_city:        dto.shippingAddress.city,
        shipping_postal_code: dto.shippingAddress.postalCode,
        shipping_country:     dto.shippingAddress.country,
        shipping_type:        dto.shippingType,
        shipping_cost:        shippingCost,
        final_price:          finalPrice,
        status:               'completado',
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { orderId: data.id, finalPrice, shippingCost };
  },

  markProductSold: async (productId: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({ is_sold: true })
      .eq('id', productId);
    if (error) throw new Error(error.message);
  },

  saveUserAddress: async (userId: string, address: ShippingAddress): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({
        shipping_name:         address.name,
        shipping_address:      address.address,
        shipping_city:         address.city,
        shipping_postal_code:  address.postalCode,
        shipping_country:      address.country,
      })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },
};
