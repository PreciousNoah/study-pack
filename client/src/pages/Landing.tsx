import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, BrainCircuit, GraduationCap } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Redirect to="/dashboard" />;
  }

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Content Section */}
      <div className="flex-1 flex flex-col p-8 lg:p-16 xl:p-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10" />
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        {/* Logo Area */}
        <div className="flex items-center gap-2 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">PrepMate</span>
        </div>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto lg:mx-0">
          <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold leading-[1.1] tracking-tight text-foreground">
              Turn your PDFs into <span className="text-primary relative">
                superpowers
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Upload any study material and instantly get concise summaries, interactive flashcards, and practice quizzes tailored to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Instant Summaries</h3>
              <p className="text-sm text-muted-foreground">Get to the core concepts in seconds.</p>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Smart Flashcards</h3>
              <p className="text-sm text-muted-foreground">Master key terms with active recall.</p>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">AI Quizzes</h3>
              <p className="text-sm text-muted-foreground">Test your knowledge before the exam.</p>
            </div>
          </div>
          
          <div className="block lg:hidden">
             <Button size="lg" className="w-full text-lg h-14" onClick={handleLogin}>
               Get Started for Free
             </Button>
          </div>
          
          <div className="mt-auto pt-8 border-t text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PrepMate. Built for learners.</p>
          </div>
        </div>
      </div>

      {/* Right Login Section (Desktop) */}
      <div className="hidden lg:flex w-[480px] bg-card border-l border-border items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your study materials</p>
          </div>

          <div className="space-y-4">
             <Button 
               size="lg" 
               className="w-full h-14 text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
               onClick={handleLogin}
             >
               Sign in with Google
             </Button>
             <p className="text-xs text-muted-foreground px-8">
               By continuing, you agree to our Terms of Service and Privacy Policy.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
