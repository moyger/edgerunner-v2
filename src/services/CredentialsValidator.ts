/**
 * Credentials Validation Service
 * Validates broker credentials before attempting connections
 */

import type { BrokerCredentials } from './brokers/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BrokerCredentialRequirements {
  required: string[];
  optional: string[];
  validators: Record<string, (value: any) => string | null>;
}

export class CredentialsValidator {
  private static readonly REQUIREMENTS: Record<string, BrokerCredentialRequirements> = {
    ibkr: {
      required: ['username', 'password'],
      optional: ['host', 'port', 'clientId'],
      validators: {
        username: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Username is required';
          }
          return null;
        },
        password: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Password is required';
          }
          return null;
        },
        host: (value: string) => {
          if (value && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/.test(value)) {
            return 'Host must be a valid IP address or "localhost"';
          }
          return null;
        },
        port: (value: any) => {
          if (value !== undefined) {
            const port = parseInt(value);
            if (isNaN(port) || port < 1 || port > 65535) {
              return 'Port must be a number between 1 and 65535';
            }
          }
          return null;
        },
        clientId: (value: any) => {
          if (value !== undefined) {
            const clientId = parseInt(value);
            if (isNaN(clientId) || clientId < 0) {
              return 'Client ID must be a non-negative number';
            }
          }
          return null;
        },
      },
    },
    mt5: {
      required: ['login', 'password', 'server'],
      optional: [],
      validators: {
        login: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Login is required';
          }
          if (!/^\d+$/.test(value.trim())) {
            return 'Login must be numeric';
          }
          return null;
        },
        password: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Password is required';
          }
          if (value.length < 4) {
            return 'Password must be at least 4 characters';
          }
          return null;
        },
        server: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Server is required';
          }
          // Basic server name validation
          if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
            return 'Server name contains invalid characters';
          }
          return null;
        },
      },
    },
    bybit: {
      required: ['apiKey', 'secretKey'],
      optional: ['testnet', 'recvWindow'],
      validators: {
        apiKey: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'API Key is required';
          }
          if (value.length < 20) {
            return 'API Key appears to be too short';
          }
          return null;
        },
        secretKey: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Secret Key is required';
          }
          if (value.length < 20) {
            return 'Secret Key appears to be too short';
          }
          return null;
        },
        testnet: (value: any) => {
          if (value !== undefined && typeof value !== 'boolean') {
            return 'Testnet must be a boolean value';
          }
          return null;
        },
        recvWindow: (value: any) => {
          if (value !== undefined) {
            const window = parseInt(value);
            if (isNaN(window) || window < 1000 || window > 60000) {
              return 'Receive window must be between 1000 and 60000 milliseconds';
            }
          }
          return null;
        },
      },
    },
  };

  static validate(broker: string, credentials: BrokerCredentials): ValidationResult {
    const requirements = this.REQUIREMENTS[broker];
    if (!requirements) {
      return {
        isValid: false,
        errors: [`Unsupported broker: ${broker}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of requirements.required) {
      if (!(field in credentials) || credentials[field] === undefined || credentials[field] === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate all provided fields
    const allFields = [...requirements.required, ...requirements.optional];
    for (const [field, value] of Object.entries(credentials)) {
      if (!allFields.includes(field)) {
        warnings.push(`Unknown field '${field}' will be ignored`);
        continue;
      }

      const validator = requirements.validators[field];
      if (validator) {
        const error = validator(value);
        if (error) {
          errors.push(error);
        }
      }
    }

    // Broker-specific warnings
    if (broker === 'bybit' && (credentials.testnet as boolean) !== false) {
      warnings.push('Using testnet mode - ensure this is intentional for production');
    }

    if (broker === 'ibkr' && credentials.host === 'localhost' && credentials.port === 7497) {
      warnings.push('Using paper trading port (7497) - switch to 7496 for live trading');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static getRequiredFields(broker: string): string[] {
    const requirements = this.REQUIREMENTS[broker];
    return requirements ? requirements.required : [];
  }

  static getOptionalFields(broker: string): string[] {
    const requirements = this.REQUIREMENTS[broker];
    return requirements ? requirements.optional : [];
  }

  static getAllFields(broker: string): string[] {
    const requirements = this.REQUIREMENTS[broker];
    return requirements ? [...requirements.required, ...requirements.optional] : [];
  }

  static getSampleCredentials(broker: string): Record<string, any> {
    const samples: Record<string, Record<string, any>> = {
      ibkr: {
        username: 'your_username',
        password: 'your_password',
        host: '127.0.0.1',
        port: 7497,
        clientId: 1,
      },
      mt5: {
        login: '1234567',
        password: 'your_password',
        server: 'YourBroker-Server',
      },
      bybit: {
        apiKey: 'your_api_key_here',
        secretKey: 'your_secret_key_here',
        testnet: true,
        recvWindow: 5000,
      },
    };

    return samples[broker] || {};
  }

  // Test credentials format without actually connecting
  static async testCredentialsFormat(broker: string, credentials: BrokerCredentials): Promise<ValidationResult> {
    const validation = this.validate(broker, credentials);
    
    // Additional format-specific tests
    if (broker === 'ibkr' && validation.isValid) {
      // Check if credentials look like they might be demo/paper trading
      if (typeof credentials.username === 'string' && credentials.username.toLowerCase().includes('demo')) {
        validation.warnings.push('Username suggests demo/paper trading account');
      }
    }

    if (broker === 'bybit' && validation.isValid) {
      // Basic API key format check
      const apiKey = credentials.apiKey as string;
      if (apiKey && !apiKey.startsWith('BYBIT')) {
        validation.warnings.push('API key format may be incorrect - ByBit keys typically start with "BYBIT"');
      }
    }

    return validation;
  }

  // Sanitize credentials for logging (remove sensitive data)
  static sanitizeForLogging(credentials: BrokerCredentials): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (['password', 'secretKey', 'apiKey', 'secret'].includes(key)) {
        sanitized[key] = value ? '••••••••' : undefined;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Check if credentials appear to be production-ready
  static isProductionReady(broker: string, credentials: BrokerCredentials): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    switch (broker) {
      case 'ibkr':
        if (credentials.port === 7497) {
          issues.push('Using paper trading port (7497) - switch to 7496 for live trading');
        }
        if (typeof credentials.username === 'string' && credentials.username.toLowerCase().includes('demo')) {
          issues.push('Username suggests demo account - ensure you have a live account for production');
        }
        break;

      case 'bybit':
        if ((credentials.testnet as boolean) !== false) {
          issues.push('Testnet mode is enabled - disable for production trading');
        }
        break;

      case 'mt5':
        if (typeof credentials.server === 'string' && credentials.server.toLowerCase().includes('demo')) {
          issues.push('Server name suggests demo account - ensure you have a live account for production');
        }
        break;
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }
}

// Default instance
export const credentialsValidator = CredentialsValidator;