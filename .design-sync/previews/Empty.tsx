import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Button,
} from "tunnelfiles";
import { FolderOpen } from "lucide-react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const NoConnections = () => (
  <Frame>
    <Empty className="w-full max-w-md">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>No connections yet</EmptyTitle>
        <EmptyDescription>
          Add an SSH profile to browse remote files and open a terminal.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">New connection</Button>
      </EmptyContent>
    </Empty>
  </Frame>
);
