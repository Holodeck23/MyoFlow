'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryState & { retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Settings Error Boundary caught an error:', error, errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          hasError={this.state.hasError}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: ErrorBoundaryState & { retry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Settings Error</span>
        </CardTitle>
        <CardDescription className="text-red-600">
          Something went wrong while loading this settings tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NODE_ENV === 'development' && error && (
          <div className="p-3 bg-red-100 rounded-md text-sm text-red-800 font-mono">
            {error.message}
          </div>
        )}
        <div className="flex space-x-2">
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Settings-specific error fallback for API failures
export function SettingsErrorFallback({ error, retry }: ErrorBoundaryState & { retry: () => void }) {
  const isApiError = error?.message?.includes('fetch') || error?.message?.includes('HTTP')

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <span>{isApiError ? 'Connection Error' : 'Loading Error'}</span>
        </CardTitle>
        <CardDescription className="text-yellow-600">
          {isApiError
            ? 'Unable to load settings data. Please check your connection and try again.'
            : 'There was a problem displaying this settings page.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorBoundary