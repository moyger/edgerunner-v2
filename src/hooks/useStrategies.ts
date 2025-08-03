import { useEffect } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { tradingApiService } from '../services';
import type { Strategy, StrategyConfig } from '../types';

export function useStrategies() {
  const {
    strategies,
    selectedStrategy,
    loading,
    errors,
    setStrategies,
    setSelectedStrategy,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    setLoading,
    setError,
    getActiveStrategies,
    getRunningStrategies,
    getStrategyById,
  } = useTradingStore();

  // Load strategies on mount
  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setLoading('strategies', true);
    setError('strategies', null);
    
    try {
      const response = await tradingApiService.getStrategies();
      if (response.status === 'success') {
        setStrategies(response.data);
      } else {
        setError('strategies', response.message || 'Failed to load strategies');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
    } finally {
      setLoading('strategies', false);
    }
  };

  const createStrategy = async (config: StrategyConfig) => {
    setLoading('strategies', true);
    setError('strategies', null);
    
    try {
      const response = await tradingApiService.createStrategy(config);
      if (response.status === 'success') {
        addStrategy(response.data);
        return response.data;
      } else {
        setError('strategies', response.message || 'Failed to create strategy');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return null;
    } finally {
      setLoading('strategies', false);
    }
  };

  const editStrategy = async (id: string, updates: Partial<Strategy>) => {
    setLoading('strategies', true);
    setError('strategies', null);
    
    try {
      const response = await tradingApiService.updateStrategy(id, updates);
      if (response.status === 'success') {
        updateStrategy(id, updates);
        return response.data;
      } else {
        setError('strategies', response.message || 'Failed to update strategy');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return null;
    } finally {
      setLoading('strategies', false);
    }
  };

  const removeStrategy = async (id: string) => {
    setLoading('strategies', true);
    setError('strategies', null);
    
    try {
      const response = await tradingApiService.deleteStrategy(id);
      if (response.status === 'success') {
        deleteStrategy(id);
        return true;
      } else {
        setError('strategies', response.message || 'Failed to delete strategy');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return false;
    } finally {
      setLoading('strategies', false);
    }
  };

  const startStrategy = async (id: string) => {
    try {
      const response = await tradingApiService.startStrategy(id);
      if (response.status === 'success') {
        updateStrategy(id, { status: 'running' });
        return true;
      } else {
        setError('strategies', response.message || 'Failed to start strategy');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return false;
    }
  };

  const stopStrategy = async (id: string) => {
    try {
      const response = await tradingApiService.stopStrategy(id);
      if (response.status === 'success') {
        updateStrategy(id, { status: 'stopped' });
        return true;
      } else {
        setError('strategies', response.message || 'Failed to stop strategy');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return false;
    }
  };

  const pauseStrategy = async (id: string) => {
    try {
      const response = await tradingApiService.pauseStrategy(id);
      if (response.status === 'success') {
        updateStrategy(id, { status: 'paused' });
        return true;
      } else {
        setError('strategies', response.message || 'Failed to pause strategy');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('strategies', errorMessage);
      return false;
    }
  };

  return {
    // Data
    strategies,
    selectedStrategy,
    activeStrategies: getActiveStrategies(),
    runningStrategies: getRunningStrategies(),
    
    // Loading states
    loading: loading.strategies,
    error: errors.strategies,
    
    // Actions
    loadStrategies,
    createStrategy,
    editStrategy,
    removeStrategy,
    startStrategy,
    stopStrategy,
    pauseStrategy,
    setSelectedStrategy,
    getStrategyById,
    
    // Refresh function for manual refresh
    refresh: loadStrategies,
  };
}