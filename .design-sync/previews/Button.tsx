import { Button } from "tunnelfiles";

// The DS-pane card has a white body; the app's signature theme is dark
// (Midnight Teal). Paint a `bg-background` surface (with the `dark` class so
// `dark:` variants resolve) so cards show the real theme, not white.
function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Variants = () => (
  <Frame className="flex flex-wrap items-center gap-3">
    <Button>Connect</Button>
    <Button variant="secondary">Cancel</Button>
    <Button variant="destructive">Delete</Button>
    <Button variant="outline">Browse…</Button>
    <Button variant="ghost">Settings</Button>
    <Button variant="link">Learn more</Button>
  </Frame>
);

export const Sizes = () => (
  <Frame className="flex items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </Frame>
);

export const States = () => (
  <Frame className="flex items-center gap-3">
    <Button>Enabled</Button>
    <Button disabled>Disabled</Button>
    <Button variant="outline" disabled>
      Disabled
    </Button>
  </Frame>
);
