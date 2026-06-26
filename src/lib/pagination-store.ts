
"use client";

/**
 * @fileOverview Client-side store for paginated data to prevent re-fetching on navigation.
 */

type PaginatedState = {
  items: any[];
  lastVisible: any | null;
  hasMore: boolean;
};

const cache: Record<string, any> = {
  adminUsers: { items: [], lastVisible: null, hasMore: true },
  adminShippings: { items: [], lastVisible: null, hasMore: true },
  adminTickets: { items: [], lastVisible: null, hasMore: true },
  userOrders: { items: [], lastVisible: null, hasMore: true },
  userShippings: { items: [], lastVisible: null, hasMore: true },
  homeRecentOrders: null, // Cache for the 3 recent orders on home
};

export const getPaginatedCache = (key: string) => cache[key];

export const updatePaginatedCache = (key: string, newState: any) => {
  cache[key] = newState;
};

export const clearPaginatedCache = (key?: string) => {
  if (key) {
    if (key === 'homeRecentOrders') {
      cache[key] = null;
    } else {
      cache[key] = { items: [], lastVisible: null, hasMore: true };
    }
  } else {
    Object.keys(cache).forEach(k => {
      if (k === 'homeRecentOrders') {
        cache[k] = null;
      } else {
        cache[k] = { items: [], lastVisible: null, hasMore: true };
      }
    });
  }
};
