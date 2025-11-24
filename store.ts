import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Campus, Role } from './types';

interface AppState {
  currentCampus: Campus | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeClassroomCourseId: string | null; // Nuevo: Para saber en qué aula está el alumno
  
  setCampus: (campus: Campus | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  enterClassroom: (courseId: string | null) => void; // Nuevo action
}

// Simulating persistence with local storage
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentCampus: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      activeClassroomCourseId: null,

      setCampus: (campus) => set({ currentCampus: campus }),
      setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      logout: () => set({ currentUser: null, isAuthenticated: false, currentCampus: null, activeClassroomCourseId: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      enterClassroom: (courseId) => set({ activeClassroomCourseId: courseId }),
    }),
    {
      name: 'unisystem-storage',
    }
  )
);