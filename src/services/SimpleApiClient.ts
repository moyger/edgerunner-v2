/**
 * Simplified API Client for testing basic connectivity
 */

const BASE_URL = 'http://localhost:8000';

export class SimpleApiClient {
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  static async get(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  static async post(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }
}

// Test functions for immediate verification
export async function testApiConnections() {
  console.log('Testing API connections...');
  
  // Test 1: Basic health check
  const isHealthy = await SimpleApiClient.testConnection();
  console.log('✓ Health check:', isHealthy ? 'Connected' : 'Failed');
  
  if (!isHealthy) {
    console.error('Backend is not reachable at', BASE_URL);
    return false;
  }

  // Test 2: Get health details
  try {
    const health = await SimpleApiClient.get('/health');
    console.log('✓ Health details:', health);
  } catch (error) {
    console.error('✗ Failed to get health details');
  }

  // Test 3: API status
  try {
    const status = await SimpleApiClient.get('/api/status');
    console.log('✓ API status:', status);
  } catch (error) {
    console.error('✗ Failed to get API status');
  }

  // Test 4: Brokers status
  try {
    const brokers = await SimpleApiClient.get('/api/brokers/status');
    console.log('✓ Brokers status:', brokers);
  } catch (error) {
    console.error('✗ Failed to get brokers status');
  }

  return true;
}