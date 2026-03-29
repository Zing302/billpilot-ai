import { AppShell } from "@/components/app-shell";

type AppPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = (await searchParams) ?? {};
  const initialFlow = params.tab === "bill" ? "bill" : "explorer";

  return <AppShell initialFlow={initialFlow} />;
}
