import { ErrorState, InlineError } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

// `code` selects the icon (WifiOff for NETWORK_LOST) and, being retryable,
// renders the Retry button when onRetry is supplied. The friendly headline is
// the localized NETWORK_LOST text; the technical message renders below it.
export const Network = () => (
  <Frame>
    <div className="border-border w-80 rounded-md border">
      <ErrorState
        error={{
          code: "NETWORK_LOST",
          message: "Connection refused — host 10.0.1.42:22",
          retryable: true,
        }}
        onRetry={() => {}}
      />
    </div>
  </Frame>
);

export const AuthFailed = () => (
  <Frame>
    <div className="border-border w-80 rounded-md border">
      <ErrorState
        error={{
          code: "AUTH_FAILED",
          message: "Permission denied (publickey,password)",
          detail: "auth attempt 5/5 — profile locked for 5 min",
          retryable: false,
        }}
      />
    </div>
  </Frame>
);

export const Inline = () => (
  <Frame className="space-y-3">
    <InlineError message="Connection refused — host 10.0.1.42:22" />
    <InlineError message="Remote path /var/log not found" />
  </Frame>
);
