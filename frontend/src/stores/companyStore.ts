/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/companyStore.ts

import { User } from "@/types";
import { create } from "zustand";
interface Department {
  id: number;
  name: string;
  description: string;
  manager: number | null;
  manager_details?: {
    id: number;
    username: string;
    email: string;
  };
  member_count: number;
  members?: number[];
  parent_department: number | null;
  full_path: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: number;
  uuid: string;
  name: string;
  legal_name: string;
  description: string;
  company_type: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  full_address: string;
  tax_id: string;
  registration_number: string;
  logo: string | null;
  primary_color: string;
  owner: number;
  owner_details: {
    id: number;
    username: string;
    email: string;
  };
  settings: any;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  department_count: number;
  member_count: number;
}

interface CompanyStore {
  companies: Company[];
  currentCompany: Company | null;
  departments: Department[];
  isLoading: boolean;
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (id: number) => Promise<void>;
  fetchCompanyDepartments: (companyId: number) => Promise<void>;
  createCompany: (data: any) => Promise<void>;
  updateCompany: (id: number, data: any) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  getCompanyStats: (id: number) => Promise<any>;
  fetchDepartmentMembers: (departmentId: number) => Promise<User[]>;
  addDepartment: (companyId: number, data: any) => Promise<void>;
  updateDepartment: (departmentId: number, data: any) => Promise<void>;
  deleteDepartment: (departmentId: number) => Promise<void>;
  addDepartmentMember: (departmentId: number, userId: number) => Promise<void>;
  removeDepartmentMember: (
    departmentId: number,
    userId: number,
  ) => Promise<void>;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  companies: [],
  currentCompany: null,
  departments: [],
  isLoading: false,

  fetchCompanies: async () => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.getAll();
      set({ companies: response.data.results || response.data });
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCompanyById: async (id: number) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.getById(id);
      set({ currentCompany: response.data });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch company:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCompanyDepartments: async (companyId: number) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.getDepartments(companyId);
      set({ departments: response.data });
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createCompany: async (data: any) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.create(data);
      set((state) => ({
        companies: [response.data, ...state.companies],
      }));
      return response.data;
    } catch (error: any) {
      console.error("BACKEND ERROR:", error.response?.data);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompany: async (id: number, data: any) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.update(id, data);
      set((state) => ({
        companies: state.companies.map((c) =>
          c.id === id ? response.data : c,
        ),
        currentCompany: response.data,
      }));
    } catch (error) {
      console.error("Failed to update company:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCompany: async (id: number) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      await companyApi.delete(id);
      set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete company:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getCompanyStats: async (id: number) => {
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.getStats(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch company stats:", error);
      throw error;
    }
  },

  fetchDepartmentMembers: async (departmentId: number) => {
    try {
      const { departmentApi } = await import("@/lib/departmentApi");

      const response = await departmentApi.getMembers(departmentId);

      return response.data;
    } catch (error) {
      console.error("Failed to fetch department members:", error);
      return [];
    }
  },
  addDepartment: async (companyId: number, data: any) => {
    set({ isLoading: true });
    try {
      const { companyApi } = await import("@/lib/companyApi");
      const response = await companyApi.addDepartment(companyId, data);
      set((state) => ({
        departments: [...state.departments, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error("Failed to add department:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateDepartment: async (departmentId: number, data: any) => {
    set({ isLoading: true });
    try {
      const { departmentApi } = await import("@/lib/departmentApi");
      const response = await departmentApi.update(departmentId, data);
      set((state) => ({
        departments: state.departments.map((d) =>
          d.id === departmentId ? response.data : d,
        ),
      }));
    } catch (error) {
      console.error("Failed to update department:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDepartment: async (departmentId: number) => {
    set({ isLoading: true });
    try {
      const { departmentApi } = await import("@/lib/departmentApi");
      await departmentApi.delete(departmentId);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== departmentId),
      }));
    } catch (error) {
      console.error("Failed to delete department:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addDepartmentMember: async (departmentId: number, userId: number) => {
    try {
      const { departmentApi } = await import("@/lib/departmentApi");
      await departmentApi.addMember(departmentId, userId);
    } catch (error) {
      console.error("Failed to add department member:", error);
      throw error;
    }
  },

  removeDepartmentMember: async (departmentId: number, userId: number) => {
    try {
      const { departmentApi } = await import("@/lib/departmentApi");
      await departmentApi.removeMember(departmentId, userId);
    } catch (error) {
      console.error("Failed to remove department member:", error);
      throw error;
    }
  },
}));
