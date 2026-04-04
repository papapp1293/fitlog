import { TemplateDetailScreen } from "@/components/workout/template-detail-screen";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateDetailScreen templateId={id} />;
}
