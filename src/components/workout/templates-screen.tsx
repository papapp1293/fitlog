"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  getWorkoutTypes,
  createWorkoutType,
  deleteWorkoutType,
} from "@/actions/workout";
import { toast } from "sonner";

interface TemplateItem {
  id: string;
  name: string;
  templateExercises: { exercise: { name: string } }[];
  _count: { sessions: number };
}

export function TemplatesScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<TemplateItem[]>({
    queryKey: ["workout-types"],
    queryFn: () => getWorkoutTypes(),
  });

  return (
    <>
      <TopBar title="Workout Templates" />
      <PageContainer className="py-4 space-y-4">
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-muted"
              />
            ))
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No templates yet. Create your first workout!
            </p>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={async () => {
                  const result = await deleteWorkoutType(template.id);
                  if (result.success) {
                    queryClient.invalidateQueries({
                      queryKey: ["workout-types"],
                    });
                    toast.success("Template deleted");
                  } else {
                    toast.error(result.error);
                  }
                }}
              />
            ))
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="w-full gap-2" size="lg">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm
              onSuccess={() => {
                setDialogOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["workout-types"],
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: {
    id: string;
    name: string;
    templateExercises: { exercise: { name: string } }[];
    _count: { sessions: number };
  };
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const exerciseNames = template.templateExercises
    .map((te) => te.exercise.name)
    .join(", ");

  return (
    <Link href={`/templates/${template.id}`}>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{template.name}</p>
            <span className="text-xs text-muted-foreground shrink-0">
              {template._count.sessions} sessions
            </span>
          </div>
          {exerciseNames && (
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {exerciseNames}
            </p>
          )}
          {template.templateExercises.length === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              No exercises added
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(onDelete);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

function CreateTemplateForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createWorkoutType({ name });
      if (result.success) {
        toast.success("Template created");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="templateName">Name</Label>
        <Input
          id="templateName"
          placeholder="e.g. Upper Body A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}
