import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import type { Quiz } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface QuizViewerProps {
  quizzes: Quiz[];
  studyPackId: number;
  quizHistory?: Array<{ score: number; attemptedAt: string; correctAnswers: number; totalQuestions: number }>;
}

export function QuizViewer({ quizzes, studyPackId, quizHistory = [] }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentQuiz = quizzes[currentIndex];

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === currentQuiz.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      saveQuizAttempt();
    }
  };

  const saveQuizAttempt = async () => {
    try {
      const percentage = Math.round((score / quizzes.length) * 100);
      await apiRequest("POST", "/api/quiz/attempt", {
        studyPackId,
        score: percentage,
        totalQuestions: quizzes.length,
        correctAnswers: score,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/study-packs/${studyPackId}`] });

      toast({
        title: "Quiz completed!",
        description: `You scored ${score}/${quizzes.length} (${percentage}%)`,
      });
    } catch (error: any) {
      console.error("Failed to save quiz attempt:", error);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (!quizzes.length) {
    return <div className="text-center py-10 text-muted-foreground">No quiz questions available.</div>;
  }

  if (showHistory) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Quiz History
          </h3>
          <Button variant="outline" onClick={() => setShowHistory(false)}>
            Back to Quiz
          </Button>
        </div>

        {quizHistory.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No quiz attempts yet. Take the quiz to see your scores here!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {quizHistory.map((attempt, idx) => {
              const color = attempt.score >= 80 ? "text-green-600" : attempt.score >= 60 ? "text-yellow-600" : "text-red-600";
              return (
                <Card key={idx}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.attemptedAt).toLocaleDateString()} at {new Date(attempt.attemptedAt).toLocaleTimeString()}
                      </p>
                      <p className="text-lg font-semibold">
                        {attempt.correctAnswers} / {attempt.totalQuestions} correct
                      </p>
                    </div>
                    <Badge className={`text-2xl font-bold ${color} bg-transparent border-2`}>
                      {attempt.score}%
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / quizzes.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="flex flex-col items-center justify-center gap-8 py-8 max-w-md mx-auto text-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center ${passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
          <span className={`text-5xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {percentage}%
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {passed ? "Great Job! 🎉" : "Keep Practicing! 📚"}
          </h2>
          <p className="text-muted-foreground text-lg">
            You got {score} out of {quizzes.length} questions correct
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={restartQuiz} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button onClick={() => setShowHistory(true)} className="flex-1 gap-2">
            <Trophy className="w-4 h-4" />
            View History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="w-full flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Question {currentIndex + 1} of {quizzes.length}</span>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
          <Trophy className="w-4 h-4" />
          History
        </Button>
      </div>

      {/* Question Card */}
      <Card className="w-full border-2 border-border">
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold mb-6 leading-relaxed">
            {currentQuiz.question}
          </h3>
          <div className="space-y-3">
            {(currentQuiz.options as string[]).map((option, idx) => {
              const isCorrect = option === currentQuiz.correctAnswer;
              const isSelected = option === selectedAnswer;
              const showCorrect = isAnswered && isCorrect;
              const showWrong = isAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : showWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showCorrect && <Check className="w-5 h-5 text-green-600" />}
                    {showWrong && <X className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      {isAnswered && (
        <Button size="lg" onClick={handleNext} className="w-full max-w-xs gap-2 animate-in fade-in slide-in-from-bottom-2">
          {currentIndex < quizzes.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            "View Results"
          )}
        </Button>
      )}

      {/* Score Indicator */}
      <div className="text-sm text-muted-foreground">
        Current Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
      </div>
    </div>
  );
}