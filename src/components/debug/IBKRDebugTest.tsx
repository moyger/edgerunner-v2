import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useMinimalIBKRConnection } from '../../store/ibkrStoreMinimal';
import { useIBKRConnectionFixed } from '../../store/ibkrStoreFixed';
import { ConnectionStatusFixed } from '../ibkr/ConnectionStatusFixed';

// Minimal test to isolate IBKR store issue
export function IBKRDebugTest() {
  const [renderCount, setRenderCount] = useState(0);
  const [testPhase, setTestPhase] = useState<'minimal' | 'fixed' | 'original' | 'complete'>('minimal');

  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`IBKRDebugTest render #${renderCount + 1}, phase: ${testPhase}`);
    
    // Safety check - if we get more than 10 renders, stop the test
    if (renderCount > 10) {
      console.error('Too many renders detected! Stopping test.');
      setTestPhase('complete');
    }
  });

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>IBKR Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Render Count:</strong> {renderCount}
        </div>
        <div>
          <strong>Current Phase:</strong> {testPhase}
        </div>
        
        {testPhase === 'minimal' && (
          <div className="space-y-2">
            <p>Phase 1: Testing minimal IBKR store</p>
            <TestMinimalIBKRHook />
            <button 
              onClick={() => setTestPhase('fixed')}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Next: Test Fixed Store
            </button>
          </div>
        )}
        
        {testPhase === 'fixed' && (
          <div className="space-y-2">
            <p>Phase 2: Testing fixed IBKR store</p>
            <TestFixedIBKRHook />
            <button 
              onClick={() => setTestPhase('original')}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Next: Test Original Store
            </button>
          </div>
        )}
        
        {testPhase === 'original' && (
          <div className="space-y-2">
            <p>Phase 3: Testing original IBKR store</p>
            <TestOriginalIBKRHook />
            <button 
              onClick={() => setTestPhase('complete')}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Complete Test
            </button>
          </div>
        )}
        
        {testPhase === 'complete' && (
          <div className="space-y-2">
            <p className="text-green-600">✅ Test Complete</p>
            <p>Check console for render patterns</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Test the minimal IBKR hook 
function TestMinimalIBKRHook() {
  const [hookRenderCount, setHookRenderCount] = useState(0);
  
  // Use the minimal hook directly
  const hookData = useMinimalIBKRConnection();

  useEffect(() => {
    setHookRenderCount(prev => prev + 1);
    console.log(`TestMinimalIBKRHook render #${hookRenderCount + 1}`, hookData);
    
    // Safety check - if we get more than 20 renders, this hook has an infinite loop
    if (hookRenderCount > 20) {
      console.error('INFINITE LOOP DETECTED in minimal hook!');
    }
  });

  return (
    <div className="p-2 border rounded">
      <p><strong>Minimal Hook Renders:</strong> {hookRenderCount}</p>
      {hookRenderCount > 20 ? (
        <p className="text-red-600">❌ INFINITE LOOP DETECTED!</p>
      ) : (
        <div className="text-sm">
          <p>✅ Minimal Hook Working:</p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            Status: {hookData.connectionStatus}
            Connected: {hookData.isConnected.toString()}
            Error: {hookData.lastError?.message || 'none'}
          </pre>
        </div>
      )}
    </div>
  );
}

// Test the fixed IBKR hook and component
function TestFixedIBKRHook() {
  const [hookRenderCount, setHookRenderCount] = useState(0);
  
  // Use the fixed hook directly
  const hookData = useIBKRConnectionFixed();

  useEffect(() => {
    setHookRenderCount(prev => prev + 1);
    console.log(`TestFixedIBKRHook render #${hookRenderCount + 1}`, hookData);
    
    // Safety check - if we get more than 20 renders, this hook has an infinite loop
    if (hookRenderCount > 20) {
      console.error('INFINITE LOOP DETECTED in fixed hook!');
    }
  });

  return (
    <div className="p-2 border rounded space-y-3">
      <p><strong>Fixed Hook Renders:</strong> {hookRenderCount}</p>
      {hookRenderCount > 20 ? (
        <p className="text-red-600">❌ INFINITE LOOP DETECTED!</p>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">
            <p>✅ Fixed Hook Working:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              Status: {hookData.connectionStatus}
              Connected: {hookData.isConnected.toString()}
              Error: {hookData.lastError?.message || 'none'}
            </pre>
          </div>
          
          {/* Test the actual fixed component */}
          <div className="border-t pt-2">
            <p className="text-sm font-medium mb-2">Testing Fixed ConnectionStatus Component:</p>
            <ConnectionStatusFixed compact={true} />
          </div>
        </div>
      )}
    </div>
  );
}

// Test the original IBKR hook in isolation
function TestOriginalIBKRHook() {
  const [hookRenderCount, setHookRenderCount] = useState(0);
  const [hookData, setHookData] = useState<any>(null);
  const [hookError, setHookError] = useState<string | null>(null);
  const [dynamicHookData, setDynamicHookData] = useState<any>(null);

  useEffect(() => {
    setHookRenderCount(prev => prev + 1);
    console.log(`TestOriginalIBKRHook render #${hookRenderCount + 1}`);
    
    // Safety check - if we get more than 10 renders, this hook has an infinite loop
    if (hookRenderCount > 10) {
      console.error('INFINITE LOOP DETECTED in original hook!');
      setHookError('Infinite loop detected - stopping test');
      return;
    }
    
    try {
      // Dynamically import to test the hook safely
      import('../../store/ibkrStore').then(({ useIBKRConnection }) => {
        try {
          // Use the hook inside a try-catch to isolate the error
          const data = useIBKRConnection();
          setDynamicHookData(data);
          console.log('Original IBKR hook data:', data);
        } catch (error) {
          console.error('Hook usage error:', error);
          setHookError(error instanceof Error ? error.message : 'Unknown error');
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      setHookError(error instanceof Error ? error.message : 'Import failed');
    }
  }, []); // Empty dependency array to prevent re-running

  return (
    <div className="p-2 border rounded">
      <p><strong>Original Hook Test Renders:</strong> {hookRenderCount}</p>
      {hookError && (
        <p className="text-red-600">❌ Error: {hookError}</p>
      )}
      {hookRenderCount > 10 ? (
        <p className="text-red-600">❌ INFINITE LOOP DETECTED!</p>
      ) : dynamicHookData ? (
        <div className="text-sm">
          <p>✅ Original Hook Data Retrieved:</p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            Status: {dynamicHookData.connectionStatus}
            Connected: {dynamicHookData.isConnected.toString()}
            Error: {dynamicHookData.lastError?.message || 'none'}
          </pre>
        </div>
      ) : (
        <p className="text-yellow-600">⏳ Loading original hook...</p>
      )}
    </div>
  );
}

export default IBKRDebugTest;