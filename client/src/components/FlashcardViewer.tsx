import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Flashcard } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FlashcardViewerProps {
  cards: (Flashcard & { progress?: { mastered: boolean } })[];
  studyPackId: number;
}

export function FlashcardViewer({ cards, studyPackId }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMasteredOnly, setShowMasteredOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredCards = showMasteredOnly
    ? cards.filter((c) => !c.progress?.mastered)
    : cards;

  const currentCard = filteredCards[currentIndex];
  const masteredCount = cards.filter((c) => c.progress?.mastered).length;
  const progressPercentage = Math.round((masteredCount / cards.length) * 100);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 200);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const toggleMastered = async (mastered: boolean) => {
    try {
      await apiRequest("POST", "/api/flashcards/progress", {
        flashcardId: currentCard.id,
        mastered,
      });

      // Refresh the study pack data
      queryClient.invalidateQueries({ queryKey: [`/api/study-packs/${studyPackId}`] });

      toast({
        title: mastered ? "Card mastered! 🎉" : "Marked for review",
        description: mastered
          ? "Keep up the great work!"
          : "You'll see this card again.",
      });

      // Move to next card if marking as mastered and showing unmastered only
      if (mastered && showMasteredOnly && filteredCards.length > 1) {
        nextCard();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!cards.length) return <div className="text-center py-10 text-muted-foreground">No flashcards available.</div>;
  if (filteredCards.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <Check className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold">All cards mastered! 🎉</h3>
        <p className="text-muted-foreground">You've mastered all the flashcards in this pack.</p>
        <Button onClick={() => setShowMasteredOnly(false)} variant="outline">
          Review all cards
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{masteredCount} / {cards.length} mastered ({progressPercentage}%)</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2">
        <Button
          variant={!showMasteredOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowMasteredOnly(false);
            setCurrentIndex(0);
          }}
        >
          All Cards ({cards.length})
        </Button>
        <Button
          variant={showMasteredOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowMasteredOnly(true);
            setCurrentIndex(0);
          }}
        >
          Study Again ({cards.length - masteredCount})
        </Button>
      </div>

      {/* Flashcard */}
      <div className="relative w-full aspect-[3/2] perspective-1000 group cursor-pointer" onClick={handleFlip}>
        {currentCard.progress?.mastered && (
          <Badge className="absolute -top-3 -right-3 z-10 bg-green-500 text-white">
            <Check className="w-3 h-3 mr-1" />
            Mastered
          </Badge>
        )}
        <motion.div
          className="w-full h-full relative transform-style-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-card border-2 border-border rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
            <span className="absolute top-4 left-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Question</span>
            <h3 className="text-xl md:text-2xl font-serif font-medium leading-relaxed text-foreground">
              {currentCard.question}
            </h3>
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Click to flip
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
            <span className="absolute top-4 left-4 text-xs font-bold text-primary uppercase tracking-wider">Answer</span>
            <p className="text-lg md:text-xl font-medium leading-relaxed text-foreground/90">
              {currentCard.answer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Mastered buttons */}
        {isFlipped && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(false);
              }}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Need Review
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(true);
              }}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              Mastered
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Button variant="outline" size="icon" onClick={prevCard} className="h-12 w-12 rounded-full shadow-sm hover:bg-muted">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {filteredCards.length}
          </span>
          <Button variant="outline" size="icon" onClick={nextCard} className="h-12 w-12 rounded-full shadow-sm hover:bg-muted">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}