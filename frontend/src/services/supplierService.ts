import api from './api';
import type { ApiResponse, Supplier, CreateSupplierDto } from '../types';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const { data } = await api.get<ApiResponse<Supplier[]>>('/suppliers');
    return data.data ?? [];
  },

  async getById(id: string): Promise<Supplier> {
    const { data } = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    if (!data.data) throw new Error('Supplier not found');
    return data.data;
  },

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const { data } = await api.post<ApiResponse<Supplier>>('/suppliers', dto);
    if (!data.data) throw new Error('Failed to create supplier');
    return data.data;
  },

  async update(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, dto);
    if (!data.data) throw new Error('Failed to update supplier');
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
