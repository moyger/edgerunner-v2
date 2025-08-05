import { useState } from 'react'
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

/**
 * Enhanced useForm hook with Zod validation
 * Provides type-safe form validation with comprehensive error handling
 */
export function useFormValidation<T extends z.ZodType<any, any>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change for real-time feedback
    ...options,
  })
}

/**
 * Custom hook for handling form submission with validation
 * Includes error handling and loading states
 */
export function useValidatedSubmit<T>(
  onSubmit: (data: T) => Promise<void> | void,
  onError?: (error: Error) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (data: T) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await onSubmit(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    handleSubmit,
    isSubmitting,
    submitError,
    clearError: () => setSubmitError(null),
  }
}

