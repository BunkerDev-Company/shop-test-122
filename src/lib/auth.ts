import Cookies from 'js-cookie';
import type { RoleCode } from '@/types';

const TOKEN_KEY   = 'shop_token';
const ROLE_KEY    = 'shop_role';
const SESSION_KEY = 'shop_cart_session';

const COOKIE_OPTIONS = { expires: 30, secure: process.env.NODE_ENV === 'production' };

export const authStorage = {
  setToken: (token: string) => Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS),
  getToken: () => Cookies.get(TOKEN_KEY),
  setRole:  (role: RoleCode) => Cookies.set(ROLE_KEY, role, COOKIE_OPTIONS),
  getRole:  (): RoleCode | undefined => Cookies.get(ROLE_KEY) as RoleCode | undefined,
  isAuthenticated: () => !!Cookies.get(TOKEN_KEY),
  clear: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(ROLE_KEY);
  },
};

/**
 * Токен гостевой корзины. Выдаёт бэкенд при первом «в корзину» и
 * возвращает в ответе; храним в cookie, чтобы корзина пережила
 * перезагрузку. После входа в аккаунт токен больше не нужен —
 * сервер уже перенёс товары в корзину пользователя.
 */
export const cartSession = {
  get:   () => Cookies.get(SESSION_KEY),
  set:   (token: string) => Cookies.set(SESSION_KEY, token, COOKIE_OPTIONS),
  clear: () => Cookies.remove(SESSION_KEY),
};
