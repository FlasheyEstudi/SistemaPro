



export enum Role {
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  STUDENT = 'student'
}

export interface Campus {
  id: string;
  name: string;
  logo_url?: string;
  theme_color?: string;
  monthly_tuition?: number; // Ahora usado como valor referencial o 0 si es gratis
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: Role;
  campus_id: string;
  avatar_url?: string;
  cover_url?: string;
  password?: string; // Opcional en frontend, necesario para registro
  meta_data?: {
    carnet?: string;
    mined_id?: string; // Código MINED
    cedula?: string;
    address?: string;
    phone?: string;
    specialty?: string;
    career_id?: string; // Link to career for filtering
    career_name?: string;
  };
}

export interface Career {
  id: string;
  name: string;
  code: string;
  campus_id: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  career_id: string;
  campus_id: string;
  professor_id?: string;
  schedule?: string;
  period: string; // Ej. "Cuatrimestre 1", "Año 1"
  weight_p1: number;
  weight_p2: number;
  weight_final: number;
  career?: Career; // Joined
  professor_name?: string; // Joined for UI display
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  grade_p1: number;
  grade_p2: number;
  grade_final: number;
  final_score?: number;
  status: 'active' | 'completed' | 'dropped';
  student?: User; // Joined data
  course?: Course; // Joined data
}

export interface Attendance {
  id: string;
  course_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'late' | 'absent';
}

export interface ScholarshipType {
  id: string;
  name: string;
  percentage: number;
  requirements: string;
}

export interface ScholarshipApplication {
  id: string;
  student_id: string;
  type_id: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  student_name?: string; // For UI display
  scholarship_name?: string; // For UI display
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
  sender_name?: string;
}

export interface Resource {
  id: string;
  course_id: string;
  title: string;
  url?: string; // Opcional si es archivo local
  file_data?: string; // Base64 del archivo
  type: 'pdf' | 'link' | 'image' | 'assignment' | 'video';
  created_at: string;
  target_type?: 'all' | 'student';
  target_student_id?: string; // Si es para un estudiante específico
}

export interface Note {
  id: string;
  student_id: string;
  title: string;
  content: string;
  is_task: boolean;
  is_completed: boolean;
  created_at: string;
}

// UI Helpers
export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}