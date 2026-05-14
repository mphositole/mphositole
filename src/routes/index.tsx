import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, FileText, ListChecks, Sparkles } from "lucide-react";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowdesk — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Generate professional emails, summarize meeting notes, and plan your day with an AI-powered productivity assistant.",
      },
    ],
  }),
  component: Home,
});

type ToolId = "email" | "summarize" | "plan";

const TOOLS: { id: ToolId; label: string; tagline: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email Generator", tagline: "Smart Email Generator", icon: Mail },
  { id: "summarize", label: "Notes Summarizer", tagline: "Meeting Notes Summarizer", icon: FileText },
  { id: "plan", label: "Task Planner", tagline: "Task Planner", icon: ListChecks },
];

function Home() {
  const [active, setActive] = useState<ToolId>("email");
  const activeTool = TOOLS.find((t) => t.id === active)!;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">Flowdesk</h1>
              <p className="text-xs text-muted-foreground">AI productivity for work</p>
            </div>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Powered by Lovable AI
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Automate the busywork. Focus on the work.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Three AI tools for the everyday workplace — write better emails, summarize
            meetings instantly, and plan your day with clarity.
          </p>
        </section>

        <nav className="mb-6 flex flex-wrap justify-center gap-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]"
                    : "bg-card text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mb-4 text-center">
          <h3 className="text-2xl font-semibold">{activeTool.tagline}</h3>
        </div>

        <ToolWorkspace key={active} tool={active} />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Built with Lovable · AI-generated content may not always be accurate. Review before use.
      </footer>
    </div>
  );
}
