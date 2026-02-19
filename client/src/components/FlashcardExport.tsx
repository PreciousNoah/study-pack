import { Button } from "@/components/ui/button";
import { Download, StickyNote } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Flashcard } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FlashcardExportProps {
  cards: Flashcard[];
  packTitle: string;
}

const STICKY_COLORS = {
  yellow: { bg: '#FFF9C4', border: '#FBC02D', name: 'Classic Yellow' },
  pink: { bg: '#F8BBD0', border: '#E91E63', name: 'Pink' },
  blue: { bg: '#BBDEFB', border: '#2196F3', name: 'Blue' },
  green: { bg: '#C8E6C9', border: '#4CAF50', name: 'Green' },
  orange: { bg: '#FFE0B2', border: '#FF9800', name: 'Orange' },
  purple: { bg: '#E1BEE7', border: '#9C27B0', name: 'Purple' },
};

export function FlashcardExport({ cards, packTitle }: FlashcardExportProps) {
  const { toast } = useToast();

  const downloadAsHTML = (colorKey: keyof typeof STICKY_COLORS) => {
    const color = STICKY_COLORS[colorKey];
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${packTitle} - Flashcards</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      .no-print { display: none; }
    }
    
    body {
      font-family: 'Comic Sans MS', 'Segoe UI', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      margin: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      margin: 0;
      color: #333;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .sticky-note {
      background: ${color.bg};
      border: 2px solid ${color.border};
      border-radius: 8px;
      padding: 20px;
      min-height: 200px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      position: relative;
      page-break-inside: avoid;
      transform: rotate(-1deg);
      transition: transform 0.2s;
    }
    
    .sticky-note:nth-child(even) {
      transform: rotate(1deg);
    }
    
    .sticky-note:hover {
      transform: rotate(0deg) scale(1.02);
      z-index: 10;
    }
    
    .sticky-note::before {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: ${color.border}40;
      border-radius: 50%;
    }
    
    .question {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 15px;
      color: #222;
      border-bottom: 2px dashed ${color.border};
      padding-bottom: 10px;
    }
    
    .answer {
      font-size: 14px;
      line-height: 1.6;
      color: #444;
    }
    
    .number {
      position: absolute;
      top: 8px;
      left: 12px;
      background: ${color.border};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    
    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 15px 30px;
      background: ${color.border};
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    
    .print-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 ${packTitle}</h1>
      <p>${cards.length} Flashcards - ${color.name} Sticky Notes</p>
    </div>
    
    <div class="grid">
      ${cards.map((card, idx) => `
        <div class="sticky-note">
          <div class="number">${idx + 1}</div>
          <div class="question">Q: ${card.question}</div>
          <div class="answer">A: ${card.answer}</div>
        </div>
      `).join('')}
    </div>
  </div>
  
  <button class="print-btn no-print" onclick="window.print()">
    🖨️ Print Flashcards
  </button>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${packTitle.replace(/\s+/g, '_')}_Flashcards_${color.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Flashcards downloaded!",
      description: `Open the HTML file in your browser to view and print your ${color.name.toLowerCase()} sticky notes.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <StickyNote className="w-4 h-4" />
          <span className="hidden sm:inline">Export Sticky Notes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(STICKY_COLORS).map(([key, color]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => downloadAsHTML(key as keyof typeof STICKY_COLORS)}
            className="gap-2"
          >
            <div
              className="w-4 h-4 rounded border-2"
              style={{ background: color.bg, borderColor: color.border }}
            />
            {color.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
