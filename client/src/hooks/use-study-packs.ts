import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useStudyPacks() {
  return useQuery({
    queryKey: [api.studyPacks.list.path],
    queryFn: async () => {
      const res = await fetch(api.studyPacks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch study packs");
      return await res.json();
    },
  });
}

export function useStudyPack(id: number) {
  return useQuery({
    queryKey: [api.studyPacks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.studyPacks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch study pack details");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateStudyPack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.studyPacks.create.path, {
        method: "POST",
        body: formData, // FormData automatically sets Content-Type to multipart/form-data
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to generate study pack");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.studyPacks.list.path] });
      toast({
        title: "Success!",
        description: "Your study pack has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteStudyPack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.studyPacks.delete.path, { id });
      const res = await fetch(url, { 
        method: "DELETE",
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete study pack");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.studyPacks.list.path] });
      toast({
        title: "Deleted",
        description: "Study pack removed successfully.",
      });
    },
  });
}
