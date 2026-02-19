import { useAuth } from "@/hooks/use-auth";
import { useStudyPacks } from "@/hooks/use-study-packs";
import { Redirect, Link } from "wouter";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Award, TrendingUp, Calendar, GraduationCap, Camera, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMemo, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data: studyPacks, isLoading: isPacksLoading } = useStudyPacks();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stats = useMemo(() => {
    if (!studyPacks) return { totalPacks: 0, totalFlashcards: 0, totalQuizzes: 0, avgMastery: 0 };
    
    const totalFlashcards = studyPacks.reduce((sum: number, pack: any) => 
      sum + (pack.flashcardCount || 0), 0);
    const totalQuizzes = studyPacks.reduce((sum: number, pack: any) => 
      sum + (pack.quizCount || 0), 0);

    return {
      totalPacks: studyPacks.length,
      totalFlashcards,
      totalQuizzes,
      avgMastery: 0,
    };
  }, [studyPacks]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData, // Don't set Content-Type header - browser will set it with boundary
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await res.json() as { avatarUrl: string };
      
      setAvatarUrl(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isAuthLoading || isPacksLoading) return <LoadingPage />;
  if (!user) return <Redirect to="/" />;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const joinDate = new Date(user.createdAt || Date.now());
  const displayAvatarUrl = avatarUrl || user.profileImageUrl;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Profile</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={displayAvatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-3xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <Button variant="outline" onClick={() => logout()}>
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Packs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPacks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalFlashcards} flashcards total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Available</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground">
                Questions to practice
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 days</div>
              <p className="text-xs text-muted-foreground">
                Keep studying daily!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Default Difficulty</p>
                <p className="text-sm text-muted-foreground">Set default quiz difficulty</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30">Easy</Badge>
                <Badge variant="default" className="cursor-pointer">Medium</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30">Hard</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {studyPacks && studyPacks.length > 0 ? (
              <div className="space-y-3">
                {studyPacks.slice(0, 5).map((pack: any) => (
                  <Link key={pack.id} href={`/study-packs/${pack.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium">{pack.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pack.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{pack.difficulty}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No study packs yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}