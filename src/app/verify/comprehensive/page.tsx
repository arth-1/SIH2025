'use client';

import { useState } from 'react';
import { ComprehensiveVerificationForm } from '@/components/comprehensive-verification-form';
import { ComprehensiveVerificationResultDisplay } from '@/components/comprehensive-verification-result-display';
import type { ComprehensiveVerificationResult } from '@/app/actions';

export default function ComprehensiveVerifyPage() {
  const [result, setResult] = useState<ComprehensiveVerificationResult | null>(null);

  const handleResult = (newResult: ComprehensiveVerificationResult) => {
    setResult(newResult);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Comprehensive Certificate Verification
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Advanced verification using blockchain validation, document integrity checks, and AI-powered signature verification
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <ComprehensiveVerificationForm onResult={handleResult} />
          </div>
          
          <div>
            {result && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">Verification Results</h2>
                <ComprehensiveVerificationResultDisplay result={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}