'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function QueryError({ message = 'Không thể tải dữ liệu', onRetry }: QueryErrorProps) {
  return (
    <div className="alert-error my-4">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold underline">
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
