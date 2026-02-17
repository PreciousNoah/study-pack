## Packages
framer-motion | Complex animations for flashcards and page transitions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes without conflicts
lucide-react | Beautiful icons
zod | Schema validation
@hookform/resolvers | Zod resolver for react-hook-form
react-hook-form | Form state management

## Notes
- Authentication is handled via Replit Auth (useAuth hook)
- PDF Upload uses FormData with key 'file' to /api/study-packs/generate
- API returns generated content (summary, flashcards, quizzes)
- Flashcards need a flip animation
- Quizzes need state for selected answers and score calculation
