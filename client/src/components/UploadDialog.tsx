import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateStudyPack } from "@/hooks/use-study-packs";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function UploadDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [summaryLength, setSummaryLength] = useState("Medium");
  const [flashcardCount, setFlashcardCount] = useState([10]);
  const [quizCount, setQuizCount] = useState([5]);
  const [textInput, setTextInput] = useState("");
  const [activeTab, setActiveTab] = useState("file");
  
  const createStudyPack = useCreateStudyPack();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, TXT, DOCX, PPTX, or XLSX file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "file" && !file) return;
    if (activeTab === "text" && !textInput) return;

    const formData = new FormData();
    if (activeTab === "file" && file) {
      formData.append("file", file);
    } else if (activeTab === "text" && textInput) {
      formData.append("textInput", textInput);
    }
    
    formData.append("difficulty", difficulty);
    formData.append("summaryLength", summaryLength);
    formData.append("flashcardCount", flashcardCount[0].toString());
    formData.append("quizCount", quizCount[0].toString());

    try {
      await createStudyPack.mutateAsync(formData);
      setOpen(false);
      setFile(null);
      setTextInput("");
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            <Sparkles className="h-4 w-4" />
            Generate New Pack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Study Pack</DialogTitle>
          <DialogDescription>
            Customize your study material and upload a file or paste text.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="text">Paste Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <div className="grid w-full items-center gap-4">
                <Label htmlFor="file-upload" className="sr-only">File</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      {file ? (
                        <>
                          <FileText className="w-8 h-8 mb-2 text-primary" />
                          <p className="mb-1 text-sm text-foreground font-medium truncate max-w-full">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-foreground font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOCX, PPTX, XLSX</p>
                        </>
                      )}
                    </div>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      accept=".pdf,.txt,.docx,.pptx,.xlsx" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Paste your study material</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste text here (minimum 50 characters)..."
                  className="min-h-[150px] resize-none"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Summary Length</Label>
                <Select value={summaryLength} onValueChange={setSummaryLength}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short">Short</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Flashcards</Label>
                  <span className="text-xs font-medium">{flashcardCount[0]}</span>
                </div>
                <Slider 
                  value={flashcardCount} 
                  onValueChange={setFlashcardCount} 
                  max={20} 
                  min={5} 
                  step={1} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Quiz Questions</Label>
                  <span className="text-xs font-medium">{quizCount[0]}</span>
                </div>
                <Slider 
                  value={quizCount} 
                  onValueChange={setQuizCount} 
                  max={50} 
                  min={3} 
                  step={1} 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={(activeTab === 'file' && !file) || (activeTab === 'text' && !textInput) || createStudyPack.isPending}
              className="bg-gradient-to-r from-primary to-primary/80 min-w-[140px]"
            >
              {createStudyPack.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Magic"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}