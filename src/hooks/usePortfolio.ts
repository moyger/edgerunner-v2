import { useEffect } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { tradingApiService } from '../services';

export function usePortfolio() {
  const {
    portfolio,
    positions,
    loading,
    errors,
    setPortfolio,
    setPositions,
    updatePosition,
    closePosition,
    setLoading,
    setError,
    getPositionsByStrategy,
    getTotalPnL,
    getDailyPnL,
  } = useTradingStore();

  // Load portfolio and positions on mount
  useEffect(() => {
    loadPortfolio();
    loadPositions();
  }, []);

  const loadPortfolio = async () => {
    setLoading('portfolio', true);
    setError('portfolio', null);
    
    try {
      const response = await tradingApiService.getPortfolio();
      if (response.status === 'success') {
        setPortfolio(response.data);
      } else {
        setError('portfolio', response.message || 'Failed to load portfolio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('portfolio', errorMessage);
    } finally {
      setLoading('portfolio', false);
    }
  };

  const loadPositions = async () => {
    setLoading('positions', true);
    setError('positions', null);
    
    try {
      const response = await tradingApiService.getPositions();
      if (response.status === 'success') {
        setPositions(response.data);
      } else {
        setError('positions', response.message || 'Failed to load positions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('positions', errorMessage);
    } finally {
      setLoading('positions', false);
    }
  };

  const closePositionById = async (id: string) => {
    setLoading('positions', true);
    setError('positions', null);
    
    try {
      const response = await tradingApiService.closePosition(id);
      if (response.status === 'success') {
        closePosition(id);
        // Refresh portfolio after position change
        await loadPortfolio();
        return true;
      } else {
        setError('positions', response.message || 'Failed to close position');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('positions', errorMessage);
      return false;
    } finally {
      setLoading('positions', false);
    }
  };

  const refreshPortfolio = async () => {
    await Promise.all([loadPortfolio(), loadPositions()]);
  };

  return {
    // Data
    portfolio,
    positions,
    openPositions: positions.filter(p => p.status === 'open'),
    closedPositions: positions.filter(p => p.status === 'closed'),
    totalPnL: getTotalPnL(),
    dailyPnL: getDailyPnL(),
    
    // Loading states
    loading: {
      portfolio: loading.portfolio,
      positions: loading.positions,
    },
    errors: {
      portfolio: errors.portfolio,
      positions: errors.positions,
    },
    
    // Actions
    loadPortfolio,
    loadPositions,
    closePosition: closePositionById,
    getPositionsByStrategy,
    refreshPortfolio,
    
    // Refresh function for manual refresh
    refresh: refreshPortfolio,
  };
}