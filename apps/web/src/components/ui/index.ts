// Austrian Medical Design System UI Components
// Core shadcn/ui components with Austrian medical theming

export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'

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
} from './card'

export {
  Input,
  PLZInput,
  UIDInput,
  IBANInput
} from './input'
export type { InputProps } from './input'

export { Label } from './label'

// Utility function for component class merging
export { cn } from '@/lib/utils'