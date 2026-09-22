import axios, { AxiosResponse } from 'axios';
import { authStorage, cartSession } from './auth';
import type {
  AdminProduct,
  AdminProductPayload,
  ApiEnvelope,
  AuthResponse,
  Brand,
  Cart,
  Category,
  CreateOrderPayload,
  CurrentUser,
  Order,
  Paginated,
  ProductDetail,
  ProductListItem,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Заголовки: токен аккаунта и токен гостевой корзины ──────────────────

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Гостевую сессию шлём всегда, когда она есть: по ней бэкенд находит
  // корзину и гостевые заказы. У авторизованного сервер её игнорирует.
  const session = cartSession.get();
  if (session) config.headers['X-Cart-Session'] = session;

  return config;
});

// ─── Распаковка конверта и обработка 401 ─────────────────────────────────
//
// Бэкенд оборачивает ответ в { data, responseTime, core, endpoint, version }.
// Разворачиваем ровно один раз, чтобы вызывающий код работал с полезной
// нагрузкой, а не с конвертом.

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = (response.data as ApiEnvelope<unknown>).data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clear();
      // На витрине 401 — обычное дело: истёк токен, а каталог смотреть
      // можно и гостем. Выбрасываем на вход только с защищённых экранов.
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isProtected = ['/profile', '/orders', '/wishlist', '/admin'].some((p) => path.startsWith(p));
      if (isProtected && !path.startsWith('/login')) {
        window.location.href = `/login?from=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  },
);

const unwrap = <T>(p: Promise<AxiosResponse<T>>) => p.then((r) => r.data);

// ─── Аутентификация ──────────────────────────────────────────────────────

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => unwrap<AuthResponse>(api.post('/authentication/register', payload)),

  login: (email: string, password: string) =>
    unwrap<AuthResponse>(api.post('/authentication/login', { email, password })),

  me: () => unwrap<CurrentUser>(api.get('/authentication/me')),

  updateMe: (payload: { firstName?: string | null; lastName?: string | null; phone?: string | null }) =>
    unwrap<CurrentUser>(api.patch('/authentication/me', payload)),
};

// ─── Каталог ─────────────────────────────────────────────────────────────

export interface ProductsQuery {
  category?: string;
  brand?:    string;
  q?:        string;
  featured?: boolean;
  sort?:     'popular' | 'price_asc' | 'price_desc' | 'new';
  page?:     number;
  perPage?:  number;
}

export const catalogApi = {
  categories: () => unwrap<Category[]>(api.get('/categories')),
  brands:     () => unwrap<Brand[]>(api.get('/brands')),

  products: (query: ProductsQuery = {}) =>
    unwrap<Paginated<ProductListItem>>(
      api.get('/products', {
        params: {
          category: query.category || undefined,
          brand:    query.brand || undefined,
          q:        query.q?.trim() || undefined,
          featured: query.featured ? 'true' : undefined,
          sort:     query.sort,
          page:     query.page,
          perPage:  query.perPage,
        },
      }),
    ),

  product: (slug: string) => unwrap<ProductDetail>(api.get(`/products/${slug}`)),
};

// ─── Корзина ─────────────────────────────────────────────────────────────
//
// Каждый ответ может принести sessionToken — так бэкенд сообщает, что
// завёл гостевую корзину. Сохраняем его сразу, иначе следующий запрос
// уйдёт без заголовка и создаст ещё одну.

function keepSession(cart: Cart): Cart {
  if (cart.sessionToken) cartSession.set(cart.sessionToken);
  return cart;
}

export const cartApi = {
  get:    () => unwrap<Cart>(api.get('/cart')).then(keepSession),
  add:    (variantId: string, qty = 1) =>
    unwrap<Cart>(api.post('/cart/items', { variantId, qty })).then(keepSession),
  update: (itemId: string, qty: number) =>
    unwrap<Cart>(api.patch(`/cart/items/${itemId}`, { qty })).then(keepSession),
  remove: (itemId: string) => unwrap<Cart>(api.delete(`/cart/items/${itemId}`)).then(keepSession),
  clear:  () => unwrap<Cart>(api.delete('/cart')).then(keepSession),
};

// ─── Заказы ──────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (payload: CreateOrderPayload) => unwrap<Order>(api.post('/orders', payload)),
  list:   () => unwrap<Order[]>(api.get('/orders')),
  get:    (id: string) => unwrap<Order>(api.get(`/orders/${id}`)),
  pay:    (id: string) => unwrap<Order>(api.post(`/orders/${id}/pay`)),
  cancel: (id: string, reason?: string) => unwrap<Order>(api.post(`/orders/${id}/cancel`, { reason })),
};

// ─── Избранное ───────────────────────────────────────────────────────────

export const wishlistApi = {
  list:   () => unwrap<ProductListItem[]>(api.get('/wishlist')),
  toggle: (productId: string) =>
    unwrap<{ productId: string; isFavourite: boolean }>(api.post(`/wishlist/${productId}`)),
  remove: (productId: string) =>
    unwrap<{ productId: string; isFavourite: boolean }>(api.delete(`/wishlist/${productId}`)),
};

// ─── Админка ─────────────────────────────────────────────────────────────

export const adminApi = {
  products: (query: { q?: string; page?: number; perPage?: number } = {}) =>
    unwrap<Paginated<AdminProduct>>(api.get('/admin/products', { params: query })),

  createProduct: (payload: AdminProductPayload) =>
    unwrap<{ id: string; slug: string; title: string }>(api.post('/admin/products', payload)),

  updateProduct: (id: string, payload: Partial<AdminProductPayload>) =>
    unwrap<{ id: string; ok: boolean }>(api.patch(`/admin/products/${id}`, payload)),

  deleteProduct: (id: string) =>
    unwrap<{ id: string; deleted: boolean; deactivated: boolean }>(api.delete(`/admin/products/${id}`)),

  createCategory: (payload: { title: string; slug?: string; sortOrder?: number }) =>
    unwrap<{ id: string; slug: string; title: string }>(api.post('/admin/categories', payload)),

  orders: (query: { status?: string; q?: string; page?: number; perPage?: number } = {}) =>
    unwrap<Paginated<Order>>(api.get('/admin/orders', { params: query })),

  order: (id: string) => unwrap<Order>(api.get(`/admin/orders/${id}`)),

  changeOrderStatus: (id: string, status: string, comment?: string) =>
    unwrap<Order>(api.patch(`/admin/orders/${id}/status`, { status, comment })),
};
