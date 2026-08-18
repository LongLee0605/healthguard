'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="card max-w-md w-full text-center p-6">
        <p className="font-semibold text-heading">Đã xảy ra lỗi</p>
        <p className="text-caption text-sm mt-2">
          {error.message || 'Trang gặp sự cố khi hiển thị. Bạn có thể thử lại.'}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" onClick={reset} className="btn-primary text-sm">
            Thử lại
          </button>
          <a href="/" className="btn-ghost text-sm">
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
