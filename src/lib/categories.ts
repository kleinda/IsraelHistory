import {
  Atom,
  FileSearch,
  Flame,
  Handshake,
  Landmark,
  type LucideIcon,
  Music,
  Plane,
  Siren,
  Swords,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react';
import type { CategoryId, HistEvent } from './types';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  soft: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: 'politics', label: 'מדיני ופוליטי', color: '#2563eb', soft: '#dbeafe', icon: Landmark },
  { id: 'military', label: 'מלחמות ומבצעים', color: '#dc2626', soft: '#fee2e2', icon: Swords },
  { id: 'terror', label: 'טרור ופיגועים', color: '#7f1d1d', soft: '#fecaca', icon: Siren },
  { id: 'affair', label: 'פרשות ושערוריות', color: '#9333ea', soft: '#f3e8ff', icon: FileSearch },
  { id: 'peace', label: 'שלום והסכמים', color: '#16a34a', soft: '#dcfce7', icon: Handshake },
  { id: 'aliyah', label: 'עלייה והתיישבות', color: '#d97706', soft: '#fef3c7', icon: Plane },
  { id: 'economy', label: 'כלכלה', color: '#0d9488', soft: '#ccfbf1', icon: TrendingUp },
  { id: 'society', label: 'חברה ומשפט', color: '#db2777', soft: '#fce7f3', icon: Users },
  { id: 'culture', label: 'תרבות וספורט', color: '#ea580c', soft: '#ffedd5', icon: Music },
  { id: 'science', label: 'מדע וטכנולוגיה', color: '#0891b2', soft: '#cffafe', icon: Atom },
  { id: 'disaster', label: 'אסונות', color: '#475569', soft: '#e2e8f0', icon: TriangleAlert },
  { id: 'shoah', label: 'השואה', color: '#57534e', soft: '#e7e5e4', icon: Flame },
];

/** True when the event belongs to any of the given categories, primary or secondary. */
export function inCategories(e: HistEvent, active: Set<CategoryId>): boolean {
  return active.has(e.category) || (e.also ?? []).some((c) => active.has(c));
}

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;
