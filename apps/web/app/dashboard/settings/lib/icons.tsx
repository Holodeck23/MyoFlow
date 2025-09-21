/**
 * Centralized icon registry for settings page
 * Only imports icons that are actually used to reduce bundle size
 */

import dynamic from 'next/dynamic'
import {
  LucideProps,
  Loader2,
  User,
  Shield,
  MapPin,
  DollarSign,
  Settings as SettingsIcon,
  Download,
  ChevronRight,
  Home
} from 'lucide-react'

// Loading fallback for dynamic icons
const IconLoader = ({ className }: { className?: string }) => (
  <Loader2 className={`animate-spin ${className || 'w-4 h-4'}`} />
)

// Core icons used in main settings layout (imported statically for immediate rendering)
export {
  User,
  Shield,
  MapPin,
  DollarSign,
  SettingsIcon,
  Download,
  ChevronRight,
  Home
}

// Dynamically imported icons for tab content (loaded only when needed)
export const DynamicIcons = {
  // Profile tab icons
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), {
    loading: () => <IconLoader />,
    ssr: false
  }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), {
    loading: () => <IconLoader />,
    ssr: false
  }),

  // Travel tab icons
  Plane: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plane })), {
    loading: () => <IconLoader />,
    ssr: false
  }),

  // Pricing tab icons
  Euro: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Euro })), {
    loading: () => <IconLoader />,
    ssr: false
  }),

  // Compliance tab icons
  AlertTriangle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertTriangle })), {
    loading: () => <IconLoader />,
    ssr: false
  }),

  // System tab icons
  Bell: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bell })), {
    loading: () => <IconLoader />,
    ssr: false
  }),
  Globe: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Globe })), {
    loading: () => <IconLoader />,
    ssr: false
  }),
  Monitor: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Monitor })), {
    loading: () => <IconLoader />,
    ssr: false
  }),

  // Overview tab icons
  FileText: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FileText })), {
    loading: () => <IconLoader />,
    ssr: false
  }),
  Languages: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Languages })), {
    loading: () => <IconLoader />,
    ssr: false
  }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), {
    loading: () => <IconLoader />,
    ssr: false
  })
}

// Tab configuration with icons
export interface SettingsTabConfig {
  id: string
  label: string
  icon: React.ComponentType<LucideProps>
  description: string
  available: boolean
  comingSoon?: string
}

export const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: SettingsIcon,
    description: 'Profile status and quick actions',
    available: true
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Business information and qualifications',
    available: true
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Shield,
    description: 'Austrian tax and legal compliance',
    available: true
  },
  {
    id: 'travel',
    label: 'Location & Travel',
    icon: MapPin,
    description: 'Base location and travel configuration',
    available: true
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: DollarSign,
    description: 'Service rates and pricing templates',
    available: true
  },
  {
    id: 'system',
    label: 'System',
    icon: SettingsIcon,
    description: 'Language, notifications, and preferences',
    available: true
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    description: 'Data export and accounting integration',
    available: false,
    comingSoon: 'v1.8'
  }
]