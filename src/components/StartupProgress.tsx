import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, XCircle, SkipForward } from 'lucide-react';
import { StartupProgress as StartupProgressType, StartupStep } from '../services/AutoStartupService';

interface StartupProgressProps {
  progress: StartupProgressType;
  onComplete?: () => void;
}

export function StartupProgress({ progress, onComplete }: StartupProgressProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (progress.overallStatus === 'completed' && onComplete) {
      // Delay calling onComplete to let user see the completion
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [progress.overallStatus, onComplete]);

  const getStepIcon = (step: StartupStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStepBadge = (step: StartupStep) => {
    const variants = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      skipped: 'outline',
      pending: 'outline',
    } as const;

    return (
      <Badge variant={variants[step.status]} className="ml-2">
        {step.status}
      </Badge>
    );
  };

  const progressPercentage = (progress.completedSteps / progress.totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Starting Edgerunner
            {progress.overallStatus === 'completed' && (
              <span className="text-green-500">✨</span>
            )}
            {progress.overallStatus === 'failed' && (
              <span className="text-red-500">⚠️</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress.completedSteps}/{progress.totalSteps}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Current Status */}
          <div className="text-center">
            {progress.overallStatus === 'completed' && (
              <div className="text-green-600 font-medium">
                🎉 Ready to trade! Launching dashboard...
              </div>
            )}
            {progress.overallStatus === 'failed' && (
              <div className="text-red-600 font-medium">
                ⚠️ Startup failed. Check details below.
              </div>
            )}
            {progress.overallStatus === 'running' && (
              <div className="text-blue-600 font-medium">
                {progress.steps.find(s => s.status === 'running')?.message || 'Initializing...'}
              </div>
            )}
          </div>

          {/* Step Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {/* Step Details */}
          {showDetails && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progress.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.duration && (
                      <span className="text-xs text-gray-500">
                        {step.duration}ms
                      </span>
                    )}
                    {getStepBadge(step)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Messages */}
          {progress.overallStatus === 'failed' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Startup Issues:
              </h4>
              <ul className="text-xs text-red-700 space-y-1">
                {progress.steps
                  .filter(step => step.error)
                  .map((step) => (
                    <li key={step.id}>
                      • {step.name}: {step.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {progress.overallStatus === 'failed' && (
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => onComplete?.()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Continue Anyway
              </button>
            </div>
          )}

          {/* Timing Info */}
          <div className="text-xs text-gray-500 text-center">
            Started: {new Date(progress.startedAt).toLocaleTimeString()}
            {progress.completedAt && (
              <>
                {' • '}
                Completed: {new Date(progress.completedAt).toLocaleTimeString()}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}