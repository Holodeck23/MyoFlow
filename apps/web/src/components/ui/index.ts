// Austrian Medical Design System UI Components
// Core shadcn/ui components with Austrian medical theming

export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MedicalCard,
  GDPRCard,
  KleinunternehmerCard
} from './Card'

export {
  Input,
  PLZInput,
  UIDInput,
  IBANInput
} from './Input'
export type { InputProps } from './Input'

export { Label } from './Label'

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

export { Calendar } from './Calendar'
export type { CalendarEvent, BlockedTimeSlot, CalendarAvailability } from './Calendar'

export { TravelRouteMap } from './TravelRouteMap'
export { VisualRouteMap } from './VisualRouteMap'
export { LanguageToggle } from './LanguageToggle'
export { AccountTypeBanner, AccountTypeBadge, getAccountTypeMeta } from './AccountTypeBanner'

// Utility function for component class merging
export { cn } from '@/lib/utils'
