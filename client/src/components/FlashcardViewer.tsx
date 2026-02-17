import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { Flashcard } from "@shared/schema";

interface FlashcardViewerProps {
  cards: Flashcard[];
}

export function FlashcardViewer({ cards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  if (!cards.length) return <div className="text-center py-10 text-muted-foreground">No flashcards available.</div>;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 w-full max-w-2xl mx-auto">
      <div className="relative w-full aspect-[3/2] perspective-1000 group cursor-pointer" onClick={handleFlip}>
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

      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" onClick={prevCard} className="h-12 w-12 rounded-full shadow-sm hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>
        <Button variant="outline" size="icon" onClick={nextCard} className="h-12 w-12 rounded-full shadow-sm hover:bg-muted">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
