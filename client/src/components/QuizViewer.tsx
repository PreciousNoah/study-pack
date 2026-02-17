import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import type { Quiz } from "@shared/schema";

interface QuizViewerProps {
  quizzes: Quiz[];
}

export function QuizViewer({ quizzes }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuiz = quizzes[currentIndex];
  // Ensure options is treated as a string array
  const options = (currentQuiz?.options as string[]) || [];

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === currentQuiz.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (!quizzes.length) return <div className="text-center py-10 text-muted-foreground">No quizzes available.</div>;

  if (showResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              className="text-muted"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
            />
            <circle
              className="text-primary"
              strokeWidth="8"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * score) / quizzes.length}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
            {Math.round((score / quizzes.length) * 100)}%
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
          <p className="text-muted-foreground">
            You scored {score} out of {quizzes.length} correct.
          </p>
        </div>

        <Button onClick={restartQuiz} size="lg" className="gap-2">
          <RefreshCcw className="w-4 h-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
        <span>Question {currentIndex + 1} of {quizzes.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xl md:text-2xl font-serif font-medium mb-8 text-foreground">
          {currentQuiz.question}
        </h3>

        <div className="space-y-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuiz.correctAnswer;
            const showCorrect = isAnswered && isCorrect;
            const showIncorrect = isAnswered && isSelected && !isCorrect;

            let buttonClass = "w-full justify-start text-left text-base p-4 h-auto border-2 transition-all duration-200 ";
            
            if (showCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100";
            } else if (showIncorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100";
            } else if (isAnswered) {
              buttonClass += "border-border opacity-50";
            } else {
              buttonClass += "border-border hover:border-primary/50 hover:bg-muted/50";
            }

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className={buttonClass}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{option}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext} 
          disabled={!isAnswered} 
          size="lg"
          className="w-full md:w-auto px-8"
        >
          {currentIndex < quizzes.length - 1 ? "Next Question" : "Finish Quiz"}
        </Button>
      </div>
    </div>
  );
}
