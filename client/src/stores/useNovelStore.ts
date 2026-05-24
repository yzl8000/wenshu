import { create } from 'zustand';
import api from '../services/api';
import type { JSONContent } from '@tiptap/react';

export interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  status: string;
  sortOrder: number;
  parentId: string | null;
  contentJson?: JSONContent;
  plainText?: string;
}

export interface NovelItem {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  status: string;
  coverImage: string | null;
  totalWords: number;
  _count: { chapters: number; characters: number };
  updatedAt: string;
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role: string | null;
  description: string | null;
  attributes: Record<string, unknown> | null;
  color: string | null;
}

export interface Relationship {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType: string;
  label: string | null;
  sourceCharacter?: { id: string; name: string };
  targetCharacter?: { id: string; name: string };
}

export interface OutlineNode {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  noteContent: string | null;
  linkedChapterId: string | null;
  sortOrder: number;
  color: string | null;
}

interface NovelState {
  novels: NovelItem[];
  chapters: Chapter[];
  currentNovelId: string | null;
  currentChapter: Chapter | null;
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  loading: boolean;
  fetchNovels: () => Promise<void>;
  createNovel: (data: { title: string; description?: string; genre?: string; targetWords?: number }) => Promise<string>;
  deleteNovel: (id: string) => Promise<void>;
  loadNovelChapters: (novelId: string) => Promise<void>;
  createChapter: (novelId: string, title: string, parentId?: string) => Promise<Chapter>;
  loadChapter: (novelId: string, chapterId: string) => Promise<void>;
  setContent: (json: JSONContent, plainText: string, wordCount: number) => void;
  autoSave: (novelId: string, chapterId: string) => Promise<void>;
  reorderChapters: (novelId: string, orderedIds: string[]) => Promise<void>;
  deleteChapter: (novelId: string, chapterId: string) => Promise<void>;
  updateChapterStatus: (novelId: string, chapterId: string, status: string) => Promise<void>;
}

export const useNovelStore = create<NovelState>((set, get) => ({
  novels: [],
  chapters: [],
  currentNovelId: null,
  currentChapter: null,
  isDirty: false,
  saveStatus: 'idle',
  loading: false,

  fetchNovels: async () => {
    set({ loading: true });
    const { data } = await api.get('/novels');
    set({ novels: data.novels, loading: false });
  },

  createNovel: async (novelData) => {
    const { data } = await api.post('/novels', novelData);
    return data.novel.id;
  },

  deleteNovel: async (id) => {
    await api.delete(`/novels/${id}`);
    set((s) => ({ novels: s.novels.filter((n) => n.id !== id) }));
  },

  loadNovelChapters: async (novelId) => {
    set({ loading: true, currentNovelId: novelId });
    const { data } = await api.get(`/novels/${novelId}/chapters`);
    set({ chapters: data.chapters, loading: false });
  },

  createChapter: async (novelId, title, parentId) => {
    const { data } = await api.post(`/novels/${novelId}/chapters`, { title, parentId });
    const chapter = data.chapter;
    set((s) => ({ chapters: [...s.chapters, chapter] }));
    return chapter;
  },

  loadChapter: async (novelId, chapterId) => {
    set({ loading: true });
    const { data } = await api.get(`/novels/${novelId}/chapters/${chapterId}`);
    set({ currentChapter: data.chapter, isDirty: false, saveStatus: 'idle', loading: false });
  },

  setContent: (json, plainText, wordCount) => {
    set((s) => ({
      currentChapter: s.currentChapter ? { ...s.currentChapter, contentJson: json, plainText, wordCount } : null,
      isDirty: true,
    }));
  },

  autoSave: async (novelId, chapterId) => {
    const ch = get().currentChapter;
    if (!ch || !get().isDirty) return;

    set({ saveStatus: 'saving' });
    try {
      await api.put(`/novels/${novelId}/chapters/${chapterId}`, {
        contentJson: ch.contentJson,
        plainText: ch.plainText,
        wordCount: ch.wordCount,
      });
      set({ isDirty: false, saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  reorderChapters: async (novelId, orderedIds) => {
    await api.put(`/novels/${novelId}/chapters-reorder`, { orderedIds });
    set((s) => ({
      chapters: orderedIds.map((id, idx) => {
        const ch = s.chapters.find((c) => c.id === id);
        return ch ? { ...ch, sortOrder: idx } : ch;
      }).filter(Boolean) as Chapter[],
    }));
  },

  deleteChapter: async (novelId, chapterId) => {
    await api.delete(`/novels/${novelId}/chapters/${chapterId}`);
    set((s) => ({
      chapters: s.chapters.filter((c) => c.id !== chapterId),
      currentChapter: s.currentChapter?.id === chapterId ? null : s.currentChapter,
    }));
  },

  updateChapterStatus: async (novelId, chapterId, status) => {
    await api.put(`/novels/${novelId}/chapters/${chapterId}`, { status });
    set((s) => ({
      chapters: s.chapters.map((c) => c.id === chapterId ? { ...c, status } : c),
      currentChapter: s.currentChapter?.id === chapterId ? { ...s.currentChapter, status } : s.currentChapter,
    }));
  },
}));
