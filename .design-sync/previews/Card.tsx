import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Default = () => (
  <Frame>
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Production</CardTitle>
        <CardDescription>root@10.0.1.42 · port 22</CardDescription>
        <CardAction>
          <Badge variant="outline">SFTP</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Last connected 2 hours ago. Host key verified (SHA256).
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Connect</Button>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </CardFooter>
    </Card>
  </Frame>
);

export const Stat = () => (
  <Frame>
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardDescription>Active transfers</CardDescription>
        <CardTitle className="text-3xl tabular-nums">3</CardTitle>
      </CardHeader>
      <CardFooter className="text-muted-foreground text-sm">12.4 MB/s · 2 queued</CardFooter>
    </Card>
  </Frame>
);
