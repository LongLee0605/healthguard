'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center p-6">
        <p className="font-semibold text-heading">Không tải được trang</p>
        <p className="text-caption text-sm mt-2">
          {error.message || 'Đã xảy ra lỗi. Thử lại hoặc quay về tổng quan.'}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" onClick={reset} className="btn-primary text-sm">
            Thử lại
          </button>
          <a href="/dashboard" className="btn-ghost text-sm">
            Về tổng quan
          </a>
        </div>
      </div>
    </div>
  );
}
