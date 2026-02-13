"use client";

import { ComparePanel } from "./ComparePanel";
import { GenerationResult } from "./GenerationResult";
import type { Project, TestHistory } from "@/types";

interface ResultViewerProps {
  project: Project;
  histories: TestHistory[];
}

export function ResultViewer({ project, histories }: ResultViewerProps) {
  return (
    <>
      <ComparePanel project={project} histories={histories} />
      <GenerationResult project={project} histories={histories} />
    </>
  );
}
