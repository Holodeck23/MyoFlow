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

// Utility function for component class merging
export { cn } from '@/lib/utils'