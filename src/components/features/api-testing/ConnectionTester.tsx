import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Eye, 
  EyeOff,
  Info
} from 'lucide-react';
import { brokerService } from '../../../services/brokers';
import type { BrokerCredentials } from '../../../services/brokers/types';
import type { ValidationResult } from '../../../services/CredentialsValidator';

interface ConnectionTesterProps {
  broker: 'ibkr' | 'mt5' | 'bybit';
}

export function ConnectionTester({ broker }: ConnectionTesterProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const requirements = brokerService.getCredentialsRequirements(broker);
  const allFields = [...requirements.required, ...requirements.optional];

  const handleInputChange = async (field: string, value: string) => {
    const newCredentials = { ...credentials, [field]: value };
    setCredentials(newCredentials);
    
    // Validate on every change
    const validationResult = await brokerService.validateCredentials(broker, newCredentials as BrokerCredentials);
    setValidation(validationResult);
  };

  const isPasswordField = (field: string) => {
    return ['password', 'secretKey'].includes(field);
  };

  const handleTestConnection = async () => {
    if (!validation?.isValid) return;

    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const success = await brokerService.testCredentialsConnection(
        broker, 
        credentials as BrokerCredentials
      );

      setConnectionResult({
        success,
        message: success 
          ? `Successfully connected to ${broker.toUpperCase()}!` 
          : `Failed to connect to ${broker.toUpperCase()}. Please check your credentials.`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getFieldPlaceholder = (field: string) => {
    const sample = requirements.sample[field];
    if (typeof sample === 'string') return sample;
    if (typeof sample === 'number') return sample.toString();
    if (typeof sample === 'boolean') return sample ? 'true' : 'false';
    return `Enter ${field}`;
  };

  const renderValidationStatus = () => {
    if (!validation) return null;

    const { isValid, errors, warnings } = validation;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            isValid ? 'text-green-700' : 'text-red-700'
          }`}>
            {isValid ? 'Credentials are valid' : 'Credentials have issues'}
          </span>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderProductionReadiness = () => {
    if (!validation?.isValid) return null;

    const productionStatus = brokerService.isProductionReady(
      broker, 
      credentials as BrokerCredentials
    );

    if (productionStatus.ready) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Configuration is production-ready
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="text-orange-800">
            <div className="font-medium mb-2">Production readiness issues:</div>
            <ul className="list-disc list-inside space-y-1">
              {productionStatus.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Connection Tester - {broker.toUpperCase()}</span>
          <Badge variant="outline">{broker}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credentials Form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Credentials</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPasswords ? 'Hide' : 'Show'} Passwords
            </Button>
          </div>

          <div className="grid gap-4">
            {allFields.map((field) => {
              const isRequired = requirements.required.includes(field);
              const isPassword = isPasswordField(field);
              
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="flex items-center gap-2">
                    {field}
                    {isRequired && <span className="text-red-500 text-xs">*</span>}
                    {!isRequired && <span className="text-gray-400 text-xs">(optional)</span>}
                  </Label>
                  <Input
                    id={field}
                    type={isPassword && !showPasswords ? 'password' : 'text'}
                    placeholder={getFieldPlaceholder(field)}
                    value={credentials[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={validation?.errors.some(error => 
                      error.toLowerCase().includes(field.toLowerCase())
                    ) ? 'border-red-300' : ''}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Status */}
        {renderValidationStatus()}

        {/* Production Readiness */}
        {renderProductionReadiness()}

        {/* Connection Test */}
        <div className="space-y-4">
          <Button
            onClick={handleTestConnection}
            disabled={!validation?.isValid || isTestingConnection}
            className="w-full"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>

          {connectionResult && (
            <Alert variant={connectionResult.success ? 'default' : 'destructive'}>
              {connectionResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div>
                  <div>{connectionResult.message}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(connectionResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Help Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Getting Started:</div>
              <ul className="list-disc list-inside text-sm space-y-1 opacity-80">
                {broker === 'ibkr' && (
                  <>
                    <li>Start TWS or IB Gateway on your machine</li>
                    <li>Enable API connections in TWS/Gateway settings</li>
                    <li>Use port 7497 for paper trading, 7496 for live trading</li>
                  </>
                )}
                {broker === 'mt5' && (
                  <>
                    <li>Install MetaTrader 5 terminal</li>
                    <li>Enable algorithmic trading in settings</li>
                    <li>Get your login credentials from your broker</li>
                  </>
                )}
                {broker === 'bybit' && (
                  <>
                    <li>Create API keys in your ByBit account</li>
                    <li>Set appropriate permissions for the API key</li>
                    <li>Use testnet for development and testing</li>
                  </>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}