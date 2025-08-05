import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useFormValidation, useValidatedSubmit } from '../../hooks/useFormValidation'
import { strategyConfigSchema, type StrategyConfig } from '../../lib/validations'

interface StrategyConfigFormProps {
  onSubmit: (data: StrategyConfig) => Promise<void>
  initialData?: Partial<StrategyConfig>
  isLoading?: boolean
}

export function StrategyConfigForm({ onSubmit, initialData, isLoading = false }: StrategyConfigFormProps) {
  const [symbolInput, setSymbolInput] = useState('')
  
  const form = useFormValidation(strategyConfigSchema, {
    defaultValues: {
      name: '',
      description: '',
      type: 'long',
      universe: [],
      maxPositionSize: 10,
      maxDailyLoss: 5,
      maxDrawdown: 15,
      leverageLimit: 1,
      stopLoss: 2,
      takeProfit: 6,
      trailingStop: 1,
      ...initialData,
    }
  })

  const { handleSubmit: submitHandler, isSubmitting, submitError, clearError } = useValidatedSubmit(onSubmit)

  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    setValue, 
    formState: { errors, isValid } 
  } = form

  const universe = watch('universe')

  // Add symbol to universe
  const addSymbol = () => {
    const symbol = symbolInput.trim().toUpperCase()
    if (symbol && !universe.includes(symbol)) {
      setValue('universe', [...universe, symbol], { shouldValidate: true })
      setSymbolInput('')
    }
  }

  // Remove symbol from universe
  const removeSymbol = (symbolToRemove: string) => {
    setValue('universe', universe.filter(s => s !== symbolToRemove), { shouldValidate: true })
  }

  // Handle Enter key in symbol input
  const handleSymbolKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSymbol()
    }
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {submitError}
            <Button 
              variant="link" 
              size="sm" 
              onClick={clearError}
              className="ml-2 h-auto p-0 text-destructive underline"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure your strategy's fundamental parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Strategy Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter strategy name"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe your strategy..."
              rows={3}
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Strategy Type *</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger 
                    id="type"
                    aria-invalid={errors.type ? 'true' : 'false'}
                    aria-describedby={errors.type ? 'type-error' : undefined}
                  >
                    <SelectValue placeholder="Select strategy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long Only</SelectItem>
                    <SelectItem value="short">Short Only</SelectItem>
                    <SelectItem value="hedge">Market Neutral</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p id="type-error" className="text-sm text-destructive" role="alert">
                {errors.type.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Universe Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Universe</CardTitle>
          <CardDescription>Define which symbols your strategy can trade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol-input">Add Symbols</Label>
            <div className="flex gap-2">
              <Input
                id="symbol-input"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                onKeyPress={handleSymbolKeyPress}
                placeholder="Enter symbol (e.g., AAPL)"
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={addSymbol}
                disabled={!symbolInput.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {universe.length > 0 && (
            <div className="space-y-2">
              <Label>Current Universe ({universe.length} symbols)</Label>
              <div className="flex flex-wrap gap-2">
                {universe.map((symbol) => (
                  <div
                    key={symbol}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                  >
                    <span>{symbol}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSymbol(symbol)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={`Remove ${symbol}`}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.universe && (
            <p className="text-sm text-destructive" role="alert">
              {errors.universe.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
          <CardDescription>Configure risk parameters and position sizing</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxPositionSize">Max Position Size (%)</Label>
            <Input
              id="maxPositionSize"
              type="number"
              step="0.1"
              min="0.01"
              max="100"
              {...register('maxPositionSize', { valueAsNumber: true })}
              aria-invalid={errors.maxPositionSize ? 'true' : 'false'}
            />
            {errors.maxPositionSize && (
              <p className="text-sm text-destructive" role="alert">
                {errors.maxPositionSize.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDailyLoss">Max Daily Loss (%)</Label>
            <Input
              id="maxDailyLoss"
              type="number"
              step="0.1"
              min="0.01"
              max="50"
              {...register('maxDailyLoss', { valueAsNumber: true })}
              aria-invalid={errors.maxDailyLoss ? 'true' : 'false'}
            />
            {errors.maxDailyLoss && (
              <p className="text-sm text-destructive" role="alert">
                {errors.maxDailyLoss.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
            <Input
              id="maxDrawdown"
              type="number"
              step="1"
              min="1"
              max="50"
              {...register('maxDrawdown', { valueAsNumber: true })}
              aria-invalid={errors.maxDrawdown ? 'true' : 'false'}
            />
            {errors.maxDrawdown && (
              <p className="text-sm text-destructive" role="alert">
                {errors.maxDrawdown.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leverageLimit">Leverage Limit</Label>
            <Input
              id="leverageLimit"
              type="number"
              step="0.1"
              min="1"
              max="10"
              {...register('leverageLimit', { valueAsNumber: true })}
              aria-invalid={errors.leverageLimit ? 'true' : 'false'}
            />
            {errors.leverageLimit && (
              <p className="text-sm text-destructive" role="alert">
                {errors.leverageLimit.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exit Logic */}
      <Card>
        <CardHeader>
          <CardTitle>Exit Logic</CardTitle>
          <CardDescription>Configure stop losses and take profits</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss (%)</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.1"
              min="0.1"
              max="20"
              {...register('stopLoss', { valueAsNumber: true })}
              aria-invalid={errors.stopLoss ? 'true' : 'false'}
            />
            {errors.stopLoss && (
              <p className="text-sm text-destructive" role="alert">
                {errors.stopLoss.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="takeProfit">Take Profit (%)</Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              {...register('takeProfit', { valueAsNumber: true })}
              aria-invalid={errors.takeProfit ? 'true' : 'false'}
            />
            {errors.takeProfit && (
              <p className="text-sm text-destructive" role="alert">
                {errors.takeProfit.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailingStop">Trailing Stop (%)</Label>
            <Input
              id="trailingStop"
              type="number"
              step="0.1"
              min="0"
              max="10"
              {...register('trailingStop', { valueAsNumber: true })}
              aria-invalid={errors.trailingStop ? 'true' : 'false'}
            />
            {errors.trailingStop && (
              <p className="text-sm text-destructive" role="alert">
                {errors.trailingStop.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={!isValid || isSubmitting || isLoading}>
          {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Strategy' : 'Create Strategy'}
        </Button>
      </div>
    </form>
  )
}