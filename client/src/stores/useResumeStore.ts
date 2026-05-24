import { create } from 'zustand';
import api from '../services/api';

export interface ResumeTemplate {
  id: string;
  name: string;
  thumbnail: string | null;
  configJson: Record<string, unknown>;
}

export interface ResumeSection {
  id: string;
  resumeId: string;
  sectionType: string;
  title: string | null;
  contentJson: Record<string, unknown>;
  sortOrder: number;
}

export interface ResumeItem {
  id: string;
  title: string;
  status: string;
  template: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  _count: { sections: number };
}

export interface ResumeDetail {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  status: string;
  template: ResumeTemplate;
  sections: ResumeSection[];
}

interface ResumeState {
  resumes: ResumeItem[];
  templates: ResumeTemplate[];
  currentResume: ResumeDetail | null;
  loading: boolean;
  fetchResumes: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  loadResume: (id: string) => Promise<void>;
  createResume: (templateId: string, title: string) => Promise<string>;
  updateResume: (id: string, data: Partial<ResumeDetail>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  upsertSection: (resumeId: string, sectionId: string, data: {
    sectionType: string; title?: string; contentJson: Record<string, unknown>; sortOrder?: number;
  }) => Promise<void>;
  deleteSection: (resumeId: string, sectionId: string) => Promise<void>;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumes: [],
  templates: [],
  currentResume: null,
  loading: false,

  fetchResumes: async () => {
    set({ loading: true });
    const { data } = await api.get('/resumes');
    set({ resumes: data.resumes, loading: false });
  },

  fetchTemplates: async () => {
    const { data } = await api.get('/resumes/templates');
    set({ templates: data.templates });
  },

  loadResume: async (id) => {
    set({ loading: true });
    const { data } = await api.get(`/resumes/${id}`);
    set({ currentResume: data.resume, loading: false });
  },

  createResume: async (templateId, title) => {
    const { data } = await api.post('/resumes', { templateId, title });
    return data.resume.id;
  },

  updateResume: async (id, resumeData) => {
    await api.put(`/resumes/${id}`, resumeData);
  },

  deleteResume: async (id) => {
    await api.delete(`/resumes/${id}`);
    set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id) }));
  },

  upsertSection: async (resumeId, sectionId, sectionData) => {
    const { data } = await api.put(`/resumes/${resumeId}/sections/${sectionId}`, sectionData);
    if (sectionId === 'new') {
      set((s) => s.currentResume ? {
        currentResume: { ...s.currentResume, sections: [...s.currentResume.sections, data.section] },
      } : {});
    } else {
      set((s) => s.currentResume ? {
        currentResume: {
          ...s.currentResume,
          sections: s.currentResume.sections.map((sec) => sec.id === sectionId ? data.section : sec),
        },
      } : {});
    }
  },

  deleteSection: async (resumeId, sectionId) => {
    await api.delete(`/resumes/${resumeId}/sections/${sectionId}`);
    set((s) => s.currentResume ? {
      currentResume: {
        ...s.currentResume,
        sections: s.currentResume.sections.filter((sec) => sec.id !== sectionId),
      },
    } : {});
  },
}));
