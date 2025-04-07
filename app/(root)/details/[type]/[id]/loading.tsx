import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Skeleton for DetailPageWrapper */}
      <div className="relative h-[60vh] w-full">
        <Skeleton className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 space-y-4">
          <Skeleton className="h-10 w-3/4 md:w-1/2" />
          <Skeleton className="h-6 w-1/2 md:w-1/3" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      <div className="pt-4 w-full px-2 md:px-8 space-y-8">
        {/* Skeleton for SeasonCarousel (placeholder) */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-28 rounded-md" />
            ))}
          </div>
        </div>

        {/* Skeleton for CrewCarousel */}
         <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                 <Skeleton key={i} className="h-24 w-24 rounded-full" />
                 <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton for ReviewsSection */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>

        {/* Skeleton for SimilarContent */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
