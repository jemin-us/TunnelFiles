/**
 * 404 Page
 */

import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-3 text-center">
        <h1 className="text-foreground text-5xl font-semibold">404</h1>
        <p className="text-muted-foreground text-sm">Page not found</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button size="sm" onClick={() => navigate("/connections")} className="gap-2">
          <HugeiconsIcon icon={Home01Icon} className="size-3.5" />
          Home
        </Button>
      </div>
    </div>
  );
}
