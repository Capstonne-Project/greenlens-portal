export default function PublicMapLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative h-dvh w-full overflow-hidden bg-background">{children}</div>;
}
