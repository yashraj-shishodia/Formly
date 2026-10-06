"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { FormRunner } from "@/components/respondent/FormRunner";
import { UnavailableScreen } from "@/components/respondent/UnavailableScreen";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicFormPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => api.getPublicForm(slug),
    retry: 1,
  });

  if (isLoading) {
    return <LoadingScreen message="Loading form..." />;
  }

  if (isError || !form) {
    return (
      <UnavailableScreen message="This form is either unpublished, saved as a draft, or does not exist." />
    );
  }

  return <FormRunner form={form} mode="live" />;
}
