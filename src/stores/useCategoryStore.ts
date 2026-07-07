import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/defaults';
import { dbService } from '@/services/firestore/dbService';

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
        dbService.save('categories', newCategory.id, newCategory);
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

        const updatedCategory = { ...existing, ...updates };
        dbService.save('categories', updatedCategory.id, updatedCategory);

        return {
          categories: state.categories.map(cat => cat.id === id ? updatedCategory : cat)
        };
      }),
      deleteCategory: (id) => set((state) => {
        dbService.delete('categories', id);
        return { categories: state.categories.filter(cat => cat.id !== id || cat.isDefault) };
      }),
      initializeDefaults: () => set((state) => {
        if (state.categories.length > 0) return state;
        const defaultCategories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          createdAt: new Date().toISOString(),
        }));
        
        defaultCategories.forEach(cat => dbService.save('categories', cat.id, cat));
        
        return { categories: defaultCategories };
      }),
    }),
    {
      name: 'expense-tracker-categories',
    }
  )
);
