import { create } from 'zustand';
import api from '../services/api';

interface AIState {
  loading: boolean;
  result: string;
  error: string | null;
  rewrite: (text: string) => Promise<string>;
  summarize: (text: string) => Promise<string>;
  generateResumeSection: (sectionType: string, context: Record<string, unknown>) => Promise<string>;
  improveResumeContent: (content: string, sectionType: string) => Promise<string>;
  novelContinue: (context: string, style: string) => Promise<string>;
  novelExpand: (scene: string, direction: string) => Promise<string>;
  novelCharacter: (novelInfo: string) => Promise<string>;
  novelBrainstorm: (novelInfo: string, type: string) => Promise<string>;
  clearResult: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  loading: false,
  result: '',
  error: null,

  rewrite: async (text: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/plagiarism/rewrite', { text });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  summarize: async (text: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/plagiarism/summarize', { text });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  generateResumeSection: async (sectionType: string, context: Record<string, unknown>) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/resume/generate', { sectionType, context });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  improveResumeContent: async (content: string, sectionType: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/resume/improve', { content, sectionType });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  novelContinue: async (context: string, style: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/novel/continue', { context, style });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  novelExpand: async (scene: string, direction: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/novel/expand', { scene, direction });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  novelCharacter: async (novelInfo: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/novel/character', { novelInfo });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  novelBrainstorm: async (novelInfo: string, type: string) => {
    set({ loading: true, error: null, result: '' });
    try {
      const { data } = await api.post('/ai/novel/brainstorm', { novelInfo, type });
      set({ result: data.result, loading: false });
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  clearResult: () => set({ result: '', error: null }),
}));
