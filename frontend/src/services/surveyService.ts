import api from './api';
import type { ApiResponse, Survey, CreateSurveyDto } from '../types';

export const surveyService = {
  async getAll(): Promise<Survey[]> {
    const { data } = await api.get<ApiResponse<Survey[]>>('/surveys');
    return data.data ?? [];
  },

  async getById(id: string): Promise<Survey> {
    const { data } = await api.get<ApiResponse<Survey>>(`/surveys/${id}`);
    if (!data.data) throw new Error('Survey not found');
    return data.data;
  },

  async create(dto: CreateSurveyDto): Promise<Survey> {
    const { data } = await api.post<ApiResponse<Survey>>('/surveys', dto);
    if (!data.data) throw new Error('Failed to create survey');
    return data.data;
  },

  async update(id: string, dto: Partial<CreateSurveyDto>): Promise<Survey> {
    const { data } = await api.put<ApiResponse<Survey>>(`/surveys/${id}`, dto);
    if (!data.data) throw new Error('Failed to update survey');
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/surveys/${id}`);
  },

  async getByToken(token: string) {
    const { data } = await api.get(`/responses/survey/${token}`);
    return data.data;
  },

  async submitResponse(token: string, answers: { question: string; value: string }[]) {
    const { data } = await api.post(`/responses/survey/${token}`, { answers });
    return data;
  },

  async assign(surveyId: string, supplierIds: string[]) {
    const { data } = await api.post(`/surveys/${surveyId}/assign`, { supplierIds });
    return data;
  },

  async sendEmails(surveyId: string) {
    const { data } = await api.post(`/surveys/${surveyId}/send`);
    return data;
  },

  async getAssignments(surveyId: string) {
    const { data } = await api.get(`/surveys/${surveyId}/assignments`);
    return data.data ?? [];
  },

  async getResponses() {
    const { data } = await api.get('/responses');
    return data.data ?? [];
  },
};
