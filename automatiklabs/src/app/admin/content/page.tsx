import Link from "next/link";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  getAdminTracks,
  getAdminCourses,
  getAdminModules,
  getAdminLessons,
} from "@/features/admin/actions/manage-content";
import { ContentTable } from "./content-table";

export default async function AdminContentPage() {
  const [tracks, courses, modules, lessons] = await Promise.all([
    getAdminTracks(),
    getAdminCourses(),
    getAdminModules(),
    getAdminLessons(),
  ]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
          Gerenciamento de Conteudo
        </h1>
      </div>

      <Tabs defaultValue="tracks">
        <TabsList>
          <TabsTrigger value="tracks">
            Trilhas ({tracks.length})
          </TabsTrigger>
          <TabsTrigger value="courses">
            Cursos ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="modules">
            Modulos ({modules.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            Aulas ({lessons.length})
          </TabsTrigger>
        </TabsList>

        {/* Tracks */}
        <TabsContent value="tracks" className="pt-4">
          <div className="mb-4 flex justify-end">
            <Button asChild>
              <Link href="/admin/content/tracks/new">Nova trilha</Link>
            </Button>
          </div>
          <ContentTable
            data={tracks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.is_published ? "published" : "draft",
              category: t.category ?? "",
              difficulty: t.difficulty,
              tier: t.tier_required,
              updated_at: t.updated_at,
            }))}
            editBase="/admin/content/tracks"
            entityType="tracks"
          />
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="pt-4">
          <div className="mb-4 flex justify-end">
            <Button asChild>
              <Link href="/admin/content/courses/new">Novo curso</Link>
            </Button>
          </div>
          <ContentTable
            data={courses.map((c) => ({
              id: c.id,
              title: c.title,
              status: c.is_published ? "published" : "draft",
              category: (c as Record<string, unknown>).track
                ? ((c as Record<string, unknown>).track as { title: string }).title
                : "",
              difficulty: "",
              tier: c.tier_required,
              updated_at: c.updated_at,
            }))}
            editBase="/admin/content/courses"
            entityType="courses"
          />
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules" className="pt-4">
          <ContentTable
            data={modules.map((m) => ({
              id: m.id,
              title: m.title,
              status: "published" as const,
              category: (m as Record<string, unknown>).course
                ? ((m as Record<string, unknown>).course as { title: string }).title
                : "",
              difficulty: "",
              tier: "",
              updated_at: m.updated_at,
            }))}
            editBase=""
            entityType="modules"
          />
        </TabsContent>

        {/* Lessons */}
        <TabsContent value="lessons" className="pt-4">
          <div className="mb-4 flex justify-end">
            <Button asChild>
              <Link href="/admin/content/lessons/new">Nova aula</Link>
            </Button>
          </div>
          <ContentTable
            data={lessons.map((l) => ({
              id: l.id,
              title: l.title,
              status: l.is_published ? "published" : "draft",
              category: (l as Record<string, unknown>).module
                ? ((l as Record<string, unknown>).module as { title: string }).title
                : "",
              difficulty: "",
              tier: l.tier_required,
              updated_at: l.updated_at,
            }))}
            editBase="/admin/content/lessons"
            entityType="lessons"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
