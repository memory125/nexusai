import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KnowledgeBase, Document, DocumentChunk } from '../types/rag';
import { EmbeddingConfig } from '../services/embeddingService';

export interface KnowledgeBaseState {
  // State
  knowledgeBases: KnowledgeBase[];
  activeKnowledgeBaseId: string | null;
  selectedKnowledgeBaseIds: string[]; // 支持多选
  selectedTags: string[]; // 标签筛选
  isUploading: boolean;
  uploadProgress: number;
  embeddingConfig: EmbeddingConfig;
  
  // Actions
  createKnowledgeBase: (name: string, description?: string, tags?: string[]) => string;
  deleteKnowledgeBase: (id: string) => void;
  setActiveKnowledgeBase: (id: string | null) => void;
  toggleKnowledgeBaseSelection: (id: string) => void;
  setSelectedKnowledgeBases: (ids: string[]) => void;
  addTagsToKnowledgeBase: (kbId: string, tags: string[]) => void;
  removeTagsFromKnowledgeBase: (kbId: string, tags: string[]) => void;
  setKnowledgeBaseTags: (kbId: string, tags: string[]) => void;
  toggleTagSelection: (tag: string) => void;
  setSelectedTags: (tags: string[]) => void;
  getAllTags: () => string[];
  getFilteredKnowledgeBases: () => KnowledgeBase[];
  addDocument: (kbId: string, document: Document, chunks: DocumentChunk[]) => void;
  removeDocument: (kbId: string, docId: string) => void;
  getActiveKnowledgeBase: () => KnowledgeBase | null;
  getSelectedKnowledgeBases: () => KnowledgeBase[];
  getAllChunks: () => DocumentChunk[];
  getSelectedChunks: () => DocumentChunk[];
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setEmbeddingConfig: (config: Partial<EmbeddingConfig>) => void;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  persist(
    (set, get) => ({
      knowledgeBases: [],
      activeKnowledgeBaseId: null,
      selectedKnowledgeBaseIds: [],
      selectedTags: [],
      isUploading: false,
      uploadProgress: 0,
      embeddingConfig: {
        model: 'simple-hash',
      },

      createKnowledgeBase: (name, description = '', tags = []) => {
        const id = `kb_${Date.now()}`;
        const newKB: KnowledgeBase = {
          id,
          name,
          description,
          tags,
          documents: [],
          chunks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          knowledgeBases: [...state.knowledgeBases, newKB],
        }));
        return id;
      },

      deleteKnowledgeBase: (id) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== id),
          activeKnowledgeBaseId: state.activeKnowledgeBaseId === id ? null : state.activeKnowledgeBaseId,
          selectedKnowledgeBaseIds: state.selectedKnowledgeBaseIds.filter((kbId) => kbId !== id),
        }));
      },

      setActiveKnowledgeBase: (id) => {
        set({ activeKnowledgeBaseId: id });
      },

      toggleKnowledgeBaseSelection: (id) => {
        set((state) => {
          const isSelected = state.selectedKnowledgeBaseIds.includes(id);
          return {
            selectedKnowledgeBaseIds: isSelected
              ? state.selectedKnowledgeBaseIds.filter((kbId) => kbId !== id)
              : [...state.selectedKnowledgeBaseIds, id],
          };
        });
      },

      setSelectedKnowledgeBases: (ids) => {
        set({ selectedKnowledgeBaseIds: ids });
      },

      addTagsToKnowledgeBase: (kbId, tags) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === kbId
              ? {
                  ...kb,
                  tags: [...new Set([...kb.tags, ...tags])],
                  updatedAt: Date.now(),
                }
              : kb
          ),
        }));
      },

      removeTagsFromKnowledgeBase: (kbId, tags) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === kbId
              ? {
                  ...kb,
                  tags: kb.tags.filter((t) => !tags.includes(t)),
                  updatedAt: Date.now(),
                }
              : kb
          ),
        }));
      },

      setKnowledgeBaseTags: (kbId, tags) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === kbId
              ? {
                  ...kb,
                  tags,
                  updatedAt: Date.now(),
                }
              : kb
          ),
        }));
      },

      toggleTagSelection: (tag) => {
        set((state) => {
          const isSelected = state.selectedTags.includes(tag);
          return {
            selectedTags: isSelected
              ? state.selectedTags.filter((t) => t !== tag)
              : [...state.selectedTags, tag],
          };
        });
      },

      setSelectedTags: (tags) => {
        set({ selectedTags: tags });
      },

      getAllTags: () => {
        const { knowledgeBases } = get();
        const allTags = new Set<string>();
        knowledgeBases.forEach((kb) => {
          kb.tags.forEach((tag) => allTags.add(tag));
        });
        return Array.from(allTags).sort();
      },

      getFilteredKnowledgeBases: () => {
        const { knowledgeBases, selectedTags } = get();
        if (selectedTags.length === 0) return knowledgeBases;
        return knowledgeBases.filter((kb) =>
          selectedTags.some((tag) => kb.tags.includes(tag))
        );
      },

      addDocument: (kbId, document, chunks) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === kbId
              ? {
                  ...kb,
                  documents: [...kb.documents, document],
                  chunks: [...kb.chunks, ...chunks],
                  updatedAt: Date.now(),
                }
              : kb
          ),
        }));
      },

      removeDocument: (kbId, docId) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === kbId
              ? {
                  ...kb,
                  documents: kb.documents.filter((d) => d.id !== docId),
                  chunks: kb.chunks.filter((c) => c.metadata.documentId !== docId),
                  updatedAt: Date.now(),
                }
              : kb
          ),
        }));
      },

      getActiveKnowledgeBase: () => {
        const { knowledgeBases, activeKnowledgeBaseId } = get();
        if (!activeKnowledgeBaseId) return null;
        return knowledgeBases.find((kb) => kb.id === activeKnowledgeBaseId) || null;
      },

      getSelectedKnowledgeBases: () => {
        const { knowledgeBases, selectedKnowledgeBaseIds } = get();
        return knowledgeBases.filter((kb) => selectedKnowledgeBaseIds.includes(kb.id));
      },

      getAllChunks: () => {
        const { knowledgeBases } = get();
        return knowledgeBases.flatMap((kb) => kb.chunks);
      },

      getSelectedChunks: () => {
        const { knowledgeBases, selectedKnowledgeBaseIds } = get();
        return knowledgeBases
          .filter((kb) => selectedKnowledgeBaseIds.includes(kb.id))
          .flatMap((kb) => kb.chunks);
      },

      setIsUploading: (uploading) => {
        set({ isUploading: uploading });
      },

      setUploadProgress: (progress) => {
        set({ uploadProgress: progress });
      },

      setEmbeddingConfig: (config) => {
        set((state) => ({
          embeddingConfig: { ...state.embeddingConfig, ...config },
        }));
      },
    }),
    {
      name: 'nexusai-knowledge-bases',
      partialize: (state) => ({
        knowledgeBases: state.knowledgeBases,
        activeKnowledgeBaseId: state.activeKnowledgeBaseId,
        selectedKnowledgeBaseIds: state.selectedKnowledgeBaseIds,
        selectedTags: state.selectedTags,
      }),
    }
  )
);
