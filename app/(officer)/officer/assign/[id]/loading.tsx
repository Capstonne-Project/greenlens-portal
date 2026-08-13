export default function OfficerAssignDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-4 px-12 pb-6 sm:px-16 md:px-20 lg:px-24 xl:px-28 2xl:px-36 min-[1920px]:px-44">
      <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-5 min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20rem)] 2xl:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-xl bg-muted sm:h-72" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
