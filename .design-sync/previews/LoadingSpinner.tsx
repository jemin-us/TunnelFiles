import { LoadingSpinner, FullPageLoader } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Sizes = () => (
  <Frame className="flex items-end gap-8">
    <LoadingSpinner size="sm" />
    <LoadingSpinner size="md" />
    <LoadingSpinner size="lg" />
  </Frame>
);

export const Labeled = () => (
  <Frame className="flex items-center justify-center">
    <LoadingSpinner size="md" label="Connecting to 10.0.1.42…" />
  </Frame>
);

export const FullPage = () => (
  <Frame className="min-h-[240px]">
    <FullPageLoader label="Loading remote directory…" />
  </Frame>
);
