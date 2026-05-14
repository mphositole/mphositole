import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { runAITool } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, RotateCcw, Sparkles, Loader2 } from "lucide-react";

type ToolId = "email" | "summarize" | "plan";

interface Props {
  tool: ToolId;
}

const initialState: Record<ToolId, Record<string, string>> = {
  email: { recipient: "Manager", tone: "Formal", purpose: "", details: "" },
  summarize: { notes: "" },
  plan: { tasks: "", horizon: "daily" },
};

export function ToolWorkspace({ tool }: Props) {
  const [fields, setFields] = useState<Record<string, string>>(initialState[tool]);
  const [output, setOutput] = useState<string>("");
  const callAI = useServerFn(runAITool);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await callAI({ data: { tool, payload: fields } });
      if (!res.ok) throw new Error(res.error);
      return res.content;
    },
    onSuccess: (content) => setOutput(content),
    onError: (err: Error) => toast.error(err.message),
  });

  const reset = () => {
    setFields(initialState[tool]);
    setOutput("");
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const canSubmit =
    tool === "email"
      ? !!fields.purpose?.trim()
      : tool === "summarize"
        ? fields.notes?.trim().length > 20
        : !!fields.tasks?.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">Input</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          {tool === "email" && "Tell us who you're writing to and why."}
          {tool === "summarize" && "Paste your raw meeting notes below."}
          {tool === "plan" && "List your tasks or goals — one per line works great."}
        </p>

        <div className="space-y-4">
          {tool === "email" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Recipient">
                  <Select
                    value={fields.recipient}
                    onValueChange={(v) => set("recipient", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tone">
                  <Select value={fields.tone} onValueChange={(v) => set("tone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Persuasive">Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Purpose">
                <Input
                  placeholder="e.g. Request a one-week deadline extension"
                  value={fields.purpose}
                  onChange={(e) => set("purpose", e.target.value)}
                />
              </Field>
              <Field label="Key details">
                <Textarea
                  rows={6}
                  placeholder="Any context, names, dates, or talking points to include…"
                  value={fields.details}
                  onChange={(e) => set("details", e.target.value)}
                />
              </Field>
            </>
          )}

          {tool === "summarize" && (
            <Field label="Meeting notes">
              <Textarea
                rows={14}
                placeholder="Paste your meeting notes here…"
                value={fields.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          )}

          {tool === "plan" && (
            <>
              <Field label="Tasks / Goals">
                <Textarea
                  rows={10}
                  placeholder={"Finish Q3 report\nReview PRs from team\nPrep client demo…"}
                  value={fields.tasks}
                  onChange={(e) => set("tasks", e.target.value)}
                />
              </Field>
              <Field label="Schedule horizon">
                <Select value={fields.horizon} onValueChange={(v) => set("horizon", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
            )}
          </Button>
          <Button variant="outline" onClick={reset} disabled={mutation.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Output */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Output</h2>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Your AI-generated result will appear here.
        </p>

        <div className="min-h-[420px] rounded-lg border bg-secondary/40 p-5">
          {mutation.isPending && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Thinking…
            </div>
          )}
          {!mutation.isPending && !output && (
            <p className="text-sm text-muted-foreground">
              Fill out the form and hit <span className="font-medium text-foreground">Generate</span> to see results.
            </p>
          )}
          {!mutation.isPending && output && (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {output}
            </pre>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          ⚠️ AI-generated content may not always be accurate. Please review before use.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
