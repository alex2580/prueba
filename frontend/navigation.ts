import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const locales = routing.locales;
export type Locale = (typeof locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
