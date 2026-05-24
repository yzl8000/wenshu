import { create } from 'zustand';
import api from '../services/api';

export interface CheckItem {
  id: string;
  title: string;
  sourceType: string;
  fileName: string | null;
  status: string;
  createdAt: string;
  _count: { results: number };
}

export interface MatchItem {
  id: string;
  sourceText: string;
  targetText: string;
  similarity: number;
  positionStart: number;
  positionEnd: number;
}

export interface PlagiarismResultItem {
  id: string;
  checkId: string;
  sourceLabel: string;
  sourceType: string;
  overallSimilarity: number;
  matchedWordCount: number;
  totalWordCount: number;
  matches: MatchItem[];
}

export interface CheckDetail {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  fileName: string | null;
  status: string;
  createdAt: string;
  results: PlagiarismResultItem[];
}

interface PlagiarismState {
  checks: CheckItem[];
  currentCheck: CheckDetail | null;
  loading: boolean;
  polling: boolean;
  fetchChecks: () => Promise<void>;
  createCheck: (data: { content: string; title?: string }) => Promise<string>;
  uploadFile: (file: File, title?: string) => Promise<string>;
  getCheck: (id: string) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  pollCheck: (id: string) => Promise<void>;
}

export const usePlagiarismStore = create<PlagiarismState>((set) => ({
  checks: [],
  currentCheck: null,
  loading: false,
  polling: false,

  fetchChecks: async () => {
    set({ loading: true });
    const { data } = await api.get('/plagiarism/checks');
    set({ checks: data.checks, loading: false });
  },

  createCheck: async ({ content, title }) => {
    const { data } = await api.post('/plagiarism/checks', { content, title });
    return data.id;
  },

  uploadFile: async (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const { data } = await api.post('/plagiarism/checks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.id;
  },

  getCheck: async (id) => {
    set({ loading: true });
    const { data } = await api.get(`/plagiarism/checks/${id}`);
    set({ currentCheck: data.check, loading: false });
  },

  deleteCheck: async (id) => {
    await api.delete(`/plagiarism/checks/${id}`);
    set((s) => ({ checks: s.checks.filter((c) => c.id !== id) }));
  },

  pollCheck: async (id) => {
    set({ polling: true });
    const maxPolls = 60;
    for (let i = 0; i < maxPolls; i++) {
      const { data } = await api.get(`/plagiarism/checks/${id}`);
      if (data.check.status === 'completed' || data.check.status === 'failed') {
        set({ currentCheck: data.check, polling: false });
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    set({ polling: false });
  },
}));
