import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
} from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate font-mono" title={value}>
        {value}
      </span>
    </div>
  );
}

export const Details = () => (
  <Frame className="min-h-[460px]">
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Connection details</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Connection details</SheetTitle>
          <SheetDescription>Active SSH session — db-prod-01</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <Row label="Host" value="db-prod-01.internal" />
          <Row label="Port" value="22" />
          <Row label="User" value="deploy" />
          <Row label="Auth" value="Private key (ed25519)" />
          <Row label="Key fingerprint" value="SHA256:Hk7sQ…rN2v" />
          <Row label="Status" value="Connected · 14m" />
        </div>
      </SheetContent>
    </Sheet>
  </Frame>
);
