import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Single = () => (
  <Frame>
    <Accordion type="single" collapsible defaultValue="connection" className="w-full max-w-md">
      <AccordionItem value="connection">
        <AccordionTrigger>Connection</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">
          Host, port, and authentication method for this SSH profile.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="transfer">
        <AccordionTrigger>Transfer</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">
          Concurrency, automatic retry count, and 64&nbsp;KB chunk streaming.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="terminal">
        <AccordionTrigger>Terminal</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">
          Font, scrollback length, and follow-directory on navigation.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Frame>
);
