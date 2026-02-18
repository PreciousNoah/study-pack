import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStudyPack } from "@/hooks/use-study-packs";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, BrainCircuit, Sparkles, Download, BadgeHelp, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewer } from "@/components/QuizViewer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function StudyPackDetails() {
  const [match, params] = useRoute("/study-packs/:id");
  const id = parseInt(params?.id || "0");
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: studyPack, isLoading, error } = useStudyPack(id);
  const { toast } = useToast();
  
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainingText, setExplainingText] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExport = useCallback(() => {
    if (!studyPack) return;

    let content = `STUDY PACK: ${studyPack.title}\n`;
    content += `Original File: ${studyPack.originalFileName}\n`;
    content += `Difficulty: ${studyPack.difficulty}\n\n`;
    
    content += `--- SUMMARY ---\n\n${studyPack.summary}\n\n`;
    
    content += `--- FLASHCARDS ---\n\n`;
    studyPack.flashcards.forEach((fc: any, i: number) => {
      content += `Q${i+1}: ${fc.question}\nA${i+1}: ${fc.answer}\n\n`;
    });
    
    content += `--- QUIZ QUESTIONS ---\n\n`;
    studyPack.quizzes.forEach((q: any, i: number) => {
      content += `Q${i+1}: ${q.question}\nOptions: ${q.options.join(", ")}\nCorrect: ${q.correctAnswer}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studyPack.title.replace(/\s+/g, "_")}_Study_Pack.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported successfully",
      description: "Your study pack has been downloaded as a text file.",
    });
  }, [studyPack, toast]);

  const handleExplain = useCallback(async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (!selectedText || selectedText.length < 5) {
      toast({
        title: "Selection too short",
        description: "Please select at least a few words to explain.",
        variant: "destructive"
      });
      return;
    }

    setExplainingText(selectedText);
    setIsExplaining(true);
    setExplanation(null);

    try {
      const res = await apiRequest("POST", "/api/explain", { 
        text: selectedText,
        context: studyPack?.summary 
      });
      const data = await res.json() as { explanation: string };
      setExplanation(data.explanation);
    } catch (err: any) {
      toast({
        title: "Explanation failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsExplaining(false);
    }
  }, [studyPack?.summary, toast]);

  if (isAuthLoading) return <LoadingPage />;
  if (!user) return <Redirect to="/" />;
  if (isLoading) return <LoadingPage />;
  
  if (error || !studyPack) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-destructive">Error loading study pack</h1>
        <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{studyPack.title}</h1>
            <p className="text-xs text-muted-foreground truncate">{studyPack.originalFileName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Pack</span>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {studyPack.topics && (studyPack.topics as string[]).length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            {(studyPack.topics as string[]).map((topic, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1 text-xs font-medium bg-primary/5 text-primary border-primary/10">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        <Tabs defaultValue="summary" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-background/50 backdrop-blur border border-border/50 rounded-xl">
              <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300">
                <Sparkles className="w-4 h-4 mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300">
                <BrainCircuit className="w-4 h-4 mr-2" />
                Quiz
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 md:p-10 prose prose-slate dark:prose-invert max-w-none relative">
                <div className="absolute top-4 right-4 z-10">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleExplain}>
                        <BadgeHelp className="w-4 h-4" />
                        Explain Selection
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            AI Explanation
                          </h4>
                        </div>
                        
                        {isExplaining ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : explanation ? (
                          <div className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border">
                            {explanation}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Select some text in the summary and click the button to get a simplified explanation.</p>
                        )}

                        {explainingText && (
                          <div className="text-[10px] text-muted-foreground italic border-t pt-2">
                            Explaining: "{explainingText.slice(0, 50)}..."
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="font-serif text-lg leading-loose whitespace-pre-line selection:bg-primary/20 selection:text-primary-foreground">
                  {studyPack.summary}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FlashcardViewer cards={studyPack.flashcards} studyPackId={studyPack.id} />
          </TabsContent>

          <TabsContent value="quiz" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuizViewer 
              quizzes={studyPack.quizzes} 
              studyPackId={studyPack.id}
              quizHistory={studyPack.progress?.quizHistory || []}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}