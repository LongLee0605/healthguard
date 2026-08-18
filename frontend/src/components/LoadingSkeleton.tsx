export default function LoadingSkeleton() {
  return (
    <div className="stack animate-fade-in">
      <div className="flex flex-col gap-2 mb-2">
        <div className="h-8 skeleton w-48" />
        <div className="h-4 skeleton w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 grid-gap">
        <div className="card h-44 skeleton xl:col-span-1" />
        <div className="xl:col-span-3 grid stat-grid-mobile lg:grid-cols-4 grid-gap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-compact h-24 skeleton" />
          ))}
        </div>
      </div>
      <div className="card h-28 skeleton" />
      <div className="grid grid-cols-1 md:grid-cols-2 grid-gap">
        <div className="card h-72 skeleton" />
        <div className="card h-72 skeleton" />
      </div>
    </div>
  );
}
