import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/defaults';

interface CategoryState {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'isDefault' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'isDefault' | 'createdAt'>>) => void;
  deleteCategory: (id: string) => void;
  initializeDefaults: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: [],
      addCategory: (category) => set((state) => {
        const nameExists = state.categories.some(c => 
          c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type
        );
        if (nameExists) throw new Error('Category with this name already exists in this type.');
        
        const newCategory: Category = {
          ...category,
          id: `cat-${Date.now()}`,
          isDefault: false,
          createdAt: new Date().toISOString(),
        };
        return { categories: [...state.categories, newCategory] };
      }),
      updateCategory: (id, updates) => set((state) => {
        const existing = state.categories.find(c => c.id === id);
        if (!existing) return state;

        if (updates.name) {
          const nameExists = state.categories.some(c => 
            c.name.toLowerCase() === updates.name!.toLowerCase() && 
            c.type === (updates.type || existing.type) &&
            c.id !== id
          );
          if (nameExists) throw new Error('Category with this name already exists.');
        }

        return {
          categories: state.categories.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
        };
      }),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(cat => cat.id !== id || cat.isDefault)
      })),
      initializeDefaults: () => set((state) => {
        if (state.categories.length > 0) return state;
        const defaultCategories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          createdAt: new Date().toISOString(),
        }));
        return { categories: defaultCategories };
      }),
    }),
    {
      name: 'expense-tracker-categories',
    }
  )
);
