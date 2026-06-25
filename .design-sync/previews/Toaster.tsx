import { Toaster, toast } from "tunnelfiles";
import * as React from "react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Notifications = () => {
  React.useEffect(() => {
    toast.success("Uploaded config.yaml", { duration: Infinity });
    toast.error("Connection refused", {
      description: "Host 10.0.1.42:22 — check credentials",
      duration: Infinity,
    });
  }, []);
  return (
    <Frame className="relative min-h-[320px]">
      <Toaster position="top-center" expand />
    </Frame>
  );
};
