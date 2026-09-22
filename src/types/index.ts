export interface ApiEnvelope<T> {
  data:         T;
  responseTime: number;
  core:         string;
  endpoint:     string;
  version:      string;
}

export interface ApiError {
  error: { code: number; message: string; httpStatus: number; details: string | null };
}

export type RoleCode = 'customer' | 'manager' | 'admin';

export interface CurrentUser {
  id:             string;
  email:          string | null;
  phone:          string | null;
  firstName:      string | null;
  lastName:       string | null;
  name:           string | null;
  role:           RoleCode;
  ordersCount?:   number;
  wishlistCount?: number;
}

export interface AuthResponse extends CurrentUser {
  access_token: string;
}

export interface Category {
  id:           string;
  slug:         string;
  title:        string;
  description:  string | null;
  imageUrl:     string | null;
  productCount: number;
}

export interface Brand {
  id:    string;
  slug:  string;
  title: string;
}

export interface ProductListItem {
  id:          string;
  slug:        string;
  title:       string;
  subtitle:    string | null;
  brand:       { slug: string; title: string } | null;
  category?:   { slug: string; title: string } | null;
  imageUrl:    string | null;
  priceMin:    number | null;
  priceMax:    number | null;
  rating:      number;
  ratingCount: number;
  inStock:     boolean;
  isFavourite: boolean;
}

export interface ProductVariant {
  id:         string;
  sku:        string;
  title:      string;
  price:      number;
  oldPrice:   number | null;
  stockQty:   number;
  attributes: Record<string, string>;
}

export interface ProductDetail extends Omit<ProductListItem, 'inStock'> {
  description: string | null;
  images:      { url: string; alt: string | null }[];
  attributes:  { name: string; value: string }[];
  variants:    ProductVariant[];
}

export interface Paginated<T> {
  items:      T[];
  page:       number;
  perPage:    number;
  total:      number;
  totalPages: number;
}

export interface CartItem {
  id:           string;
  qty:          number;
  variantId:    string;
  sku:          string;
  variantTitle: string;
  productTitle: string;
  productSlug:  string;
  imageUrl:     string | null;
  price:        number;
  oldPrice:     number | null;
  lineTotal:    number;
  stockQty:     number;
  isAvailable:  boolean;
}

export interface Cart {
  id:           string | null;
  sessionToken: string | null;
  items:        CartItem[];
  itemsCount:   number;
  itemsTotal:   number;
}

export type OrderStatus = 'new' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryMethod = 'courier' | 'pickup';

export interface OrderItem {
  id:           string;
  productTitle: string;
  variantTitle: string;
  sku:          string;
  imageUrl:     string | null;
  price:        number;
  qty:          number;
  lineTotal:    number;
}

export interface Order {
  id:              string;
  number:          string;
  status:          OrderStatus;
  paymentStatus:   PaymentStatus;
  paymentMethod:   string;
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string | null;
  deliveryMethod:  DeliveryMethod;
  deliveryAddress: string | null;
  deliveryPrice:   number;
  comment:         string | null;
  itemsTotal:      number;
  totalAmount:     number;
  createdAt:       string;
  items:           OrderItem[];
  history:         { status: OrderStatus; comment: string | null; createdAt: string }[];
}

export interface CreateOrderPayload {
  customerName:     string;
  customerEmail:    string;
  customerPhone?:   string;
  deliveryMethod:   DeliveryMethod;
  deliveryAddress?: string;
  comment?:         string;
}

export interface AdminVariantInput {
  id?:         string;
  sku:         string;
  title:       string;
  price:       number;
  oldPrice?:   number | null;
  stockQty:    number;
  attributes?: Record<string, string>;
  isActive?:   boolean;
}

export interface AdminProduct {
  id:          string;
  slug:        string;
  title:       string;
  subtitle:    string | null;
  description: string | null;
  categoryId:  string | null;
  brandId:     string | null;
  category:    { slug: string; title: string } | null;
  brand:       { slug: string; title: string } | null;
  imageUrl:    string | null;
  priceMin:    number | null;
  priceMax:    number | null;
  isActive:    boolean;
  isFeatured:  boolean;
  stockTotal:  number;
  attributes:  { name: string; value: string }[];
  variants:    (AdminVariantInput & { id: string })[];
}

export interface AdminProductPayload {
  title:        string;
  slug?:        string;
  subtitle?:    string | null;
  description?: string | null;
  categoryId?:  string | null;
  brandId?:     string | null;
  imageUrl?:    string | null;
  isActive?:    boolean;
  isFeatured?:  boolean;
  attributes?:  { name: string; value: string }[];
  variants:     AdminVariantInput[];
}
