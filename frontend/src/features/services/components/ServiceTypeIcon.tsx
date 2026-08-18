import type { ServiceTypeIconName } from '@programme/contracts';
import {
  BedDouble,
  CakeSlice,
  Camera,
  CarFront,
  Flower2,
  Landmark,
  Lightbulb,
  Music2,
  Palette,
  PartyPopper,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';

export const serviceTypeIconOptions: {
  value: ServiceTypeIconName;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'sparkles', label: 'General service', icon: Sparkles },
  { value: 'venue', label: 'Venue', icon: Landmark },
  { value: 'stay', label: 'Hotel or stay', icon: BedDouble },
  { value: 'catering', label: 'Catering', icon: UtensilsCrossed },
  { value: 'photography', label: 'Photography', icon: Camera },
  { value: 'music', label: 'Music or DJ', icon: Music2 },
  { value: 'decor', label: 'Decoration', icon: Palette },
  { value: 'flowers', label: 'Flowers', icon: Flower2 },
  { value: 'cake', label: 'Cake or desserts', icon: CakeSlice },
  { value: 'transport', label: 'Transport', icon: CarFront },
  { value: 'tent', label: 'Tent or outdoor', icon: TentTree },
  { value: 'entertainment', label: 'Entertainment', icon: PartyPopper },
  { value: 'lighting', label: 'Lighting', icon: Lightbulb },
  { value: 'beauty', label: 'Beauty or styling', icon: WandSparkles },
];

const icons = Object.fromEntries(
  serviceTypeIconOptions.map((option) => [option.value, option.icon]),
) as Record<ServiceTypeIconName, LucideIcon>;
export const getServiceTypeIcon = (icon?: ServiceTypeIconName): LucideIcon =>
  icon ? icons[icon] : Sparkles;
