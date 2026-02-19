import { useAuth } from "@/hooks/use-auth";
import { useStudyPacks, useDeleteStudyPack } from "@/hooks/use-study-packs";
import { Link, Redirect } from "wouter";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { UploadDialog } from "@/components/UploadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, FileText, ArrowRight, LayoutGrid, GraduationCap, Search, Tag, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function Dashboard() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data: studyPacks, isLoading: isPacksLoading } = useStudyPacks();
  const deleteStudyPack = useDeleteStudyPack();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const allCategories = useMemo(() => {
    if (!studyPacks) return [];
    const topics = new Set<string>();
    studyPacks.forEach((pack: any) => {
      (pack.topics || []).forEach((t: string) => topics.add(t));
    });
    return Array.from(topics).sort();
  }, [studyPacks]);

  const filteredPacks = useMemo(() => {
    if (!studyPacks) return [];
    return studyPacks.filter((pack: any) => {
      const matchesSearch =
        !search ||
        pack.title.toLowerCase().includes(search.toLowerCase()) ||
        (pack.summary || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategory || (pack.topics || []).includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [studyPacks, search, selectedCategory]);

  if (isAuthLoading) return <LoadingPage />;
  if (!user) return <Redirect to="/" />;
  if (isPacksLoading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">PrepMate</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline-block">Hello,</span>
              <Link href="/profile">
                <span className="font-medium text-foreground hover:text-primary cursor-pointer">{user.firstName || 'Student'}</span>
              </Link>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">Your Library</h1>
            <p className="text-muted-foreground">Manage your study materials and generated content.</p>
          </div>
          <UploadDialog />
        </div>

        {studyPacks && studyPacks.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search study packs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    !selectedCategory
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  All
                </button>
                {(showAllCategories ? allCategories : allCategories.slice(0, 5)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {allCategories.length > 5 && (
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="px-3 py-1 rounded-full text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {showAllCategories ? '- Show less' : `+ ${allCategories.length - 5} more`}
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Showing {filteredPacks.length} of {studyPacks.length} packs
            </p>
          </div>
        )}

        {studyPacks && studyPacks.length > 0 ? (
          filteredPacks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacks.map((pack: any) => (
                <HoverCard key={pack.id} openDelay={300}>
                  <HoverCardTrigger asChild>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 flex flex-col cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{pack.title}" and all its flashcards and quizzes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStudyPack.mutate(pack.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <CardTitle className="mt-4 line-clamp-1 text-lg group-hover:text-primary transition-colors">
                          {pack.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">
                          {format(new Date(pack.createdAt), 'MMM d, yyyy • h:mm a')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {pack.summary || "No summary available."}
                        </p>
                        {pack.difficulty && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[pack.difficulty] || DIFFICULTY_COLORS.Medium}`}>
                            {pack.difficulty}
                          </span>
                        )}
                        {pack.topics && pack.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pack.topics.slice(0, 3).map((topic: string) => (
                              <button
                                key={topic}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(topic);
                                }}
                                className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                {topic}
                              </button>
                            ))}
                            {pack.topics.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                +{pack.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-4 border-t bg-muted/20">
                        <Link href={`/study-packs/${pack.id}`} className="w-full">
                          <Button variant="secondary" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            Open Study Pack
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96" side="top">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-semibold">Quick Preview</h4>
                          <p className="text-xs text-muted-foreground line-clamp-4">
                            {pack.summary || "No summary available."}
                          </p>
                        </div>
                      </div>
                      {pack.flashcards && pack.flashcards.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">First 3 Flashcards:</p>
                          {pack.flashcards.slice(0, 3).map((fc: any, idx: number) => (
                            <div key={fc.id} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                              <p className="font-medium">{idx + 1}. {fc.question}</p>
                              <p className="text-muted-foreground">{fc.answer}</p>
                            </div>
                          ))}
                          {pack.flashcards.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{pack.flashcards.length - 3} more flashcards</p>
                          )}
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border rounded-3xl bg-card">
              <Search className="w-10 h-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-muted-foreground max-w-md mb-4">
                No study packs match your search. Try a different keyword or category.
              </p>
              <Button variant="ghost" onClick={() => { setSearch(""); setSelectedCategory(null); }}>
                Clear filters
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border rounded-3xl bg-card">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No study packs yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Upload your first PDF document to get started. We'll generate summaries, flashcards, and quizzes for you.
            </p>
            <UploadDialog />
          </div>
        )}
      </main>
    </div>
  );
}