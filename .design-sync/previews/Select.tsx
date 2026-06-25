import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Menu = () => (
  <Frame className="flex min-h-[340px] items-start">
    <Select defaultValue="key" defaultOpen>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Authentication" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Authentication</SelectLabel>
          <SelectItem value="password">Password</SelectItem>
          <SelectItem value="key">Private key</SelectItem>
          <SelectItem value="agent">SSH agent</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </Frame>
);
