
import { Campus, User, Role, Course, Enrollment, Notification, Resource, Attendance, ScholarshipType, ScholarshipApplication, Note, Career } from '../types';

// --- CONFIG ---
const USE_MOCK = false; // Mantener true para demo frontend, false para producción
const API_URL = 'http://localhost:3000/api';

const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

// --- MOCK DATA ---
let MOCK_CAMPUSES: Campus[] = [
  { id: 'c1', name: 'Campus Norte', theme_color: 'blue', monthly_tuition: 0 },
  { id: 'c2', name: 'Campus Sur', theme_color: 'red', monthly_tuition: 0 }
];
let MOCK_CAREERS: Career[] = [
  { id: 'car1', name: 'Ingeniería en Sistemas', code: 'SIS', campus_id: 'c1' },
  { id: 'car2', name: 'Arquitectura', code: 'ARQ', campus_id: 'c2' },
  { id: 'car3', name: 'Medicina General', code: 'MED', campus_id: 'c1' }
];

let MOCK_USERS: User[] = [
  // Campus Norte Users
  { id: 'u1', username: 'admin', password: 'admin', full_name: 'Super Admin Norte', email: 'admin@uni.edu', role: Role.ADMIN, campus_id: 'c1', avatar_url: 'https://ui-avatars.com/api/?name=Admin+Norte&background=0D8ABC&color=fff' },
  { id: 'u2', username: 'prof', password: 'prof', full_name: 'Dr. Gregory House', email: 'prof@uni.edu', role: Role.PROFESSOR, campus_id: 'c1', avatar_url: 'https://ui-avatars.com/api/?name=Gregory+House&background=random', meta_data: { specialty: 'Diagnóstico', cedula: '001-000000-0000A', phone: '8888-8888' } },
  { id: 'u3', username: 'student', password: 'student', full_name: 'Ana García', email: 'ana@uni.edu', role: Role.STUDENT, campus_id: 'c1', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', cover_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', meta_data: { carnet: '2023-001', address: 'Av. Central 123', phone: '555-0192', career_name: 'Ingeniería en Sistemas', career_id: 'car1', cedula: '001-121299-1000F', mined_id: 'MINED-9988' } },

  // Campus Sur Users
  { id: 'u4', username: 'admin', password: 'admin', full_name: 'Super Admin Sur', email: 'admin.sur@uni.edu', role: Role.ADMIN, campus_id: 'c2', avatar_url: 'https://ui-avatars.com/api/?name=Admin+Sur&background=EF4444&color=fff' },
  { id: 'u5', username: 'prof', password: 'prof', full_name: 'Dra. Lisa Cuddy', email: 'prof.sur@uni.edu', role: Role.PROFESSOR, campus_id: 'c2', avatar_url: 'https://ui-avatars.com/api/?name=Lisa+Cuddy&background=random', meta_data: { specialty: 'Administración' } },
  { id: 'u6', username: 'student', password: 'student', full_name: 'Carlos Pérez', email: 'carlos@uni.edu', role: Role.STUDENT, campus_id: 'c2', avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Perez&background=random', meta_data: { carnet: '2023-055', address: 'Calle Sur 456', phone: '555-9988', career_name: 'Arquitectura', career_id: 'car2' } },
];

let MOCK_COURSES: Course[] = [
  { id: 'co1', name: 'Introducción a la Programación', code: 'CS101', career_id: 'car1', campus_id: 'c1', professor_id: 'u2', schedule: 'Lun/Mie 08:00', weight_p1: 30, weight_p2: 30, weight_final: 40, period: 'Cuatrimestre 1' },
  { id: 'co2', name: 'Matemática Discreta', code: 'CS102', career_id: 'car1', campus_id: 'c1', professor_id: 'u2', schedule: 'Mar/Jue 10:00', weight_p1: 30, weight_p2: 30, weight_final: 40, period: 'Cuatrimestre 1' },
  { id: 'co3', name: 'Base de Datos I', code: 'CS201', career_id: 'car1', campus_id: 'c1', professor_id: 'u2', schedule: 'Lun/Vie 14:00', weight_p1: 30, weight_p2: 30, weight_final: 40, period: 'Cuatrimestre 2' },
  { id: 'co4', name: 'Anatomía I', code: 'MD101', career_id: 'car3', campus_id: 'c1', professor_id: 'u2', schedule: 'Mar/Jue 07:00', weight_p1: 30, weight_p2: 30, weight_final: 40, period: 'Cuatrimestre 1' },
];
let MOCK_ENROLLMENTS: Enrollment[] = [
  { id: 'e1', student_id: 'u3', course_id: 'co1', grade_p1: 85, grade_p2: 90, grade_final: 0, status: 'active' },
  { id: 'e2', student_id: 'u3', course_id: 'co2', grade_p1: 70, grade_p2: 0, grade_final: 0, status: 'active' },
  { id: 'e3', student_id: 'u6', course_id: 'co3', grade_p1: 95, grade_p2: 88, grade_final: 0, status: 'active' },
];
let MOCK_ATTENDANCE: Attendance[] = [];
let MOCK_RESOURCES: Resource[] = [];
let MOCK_NOTES: Note[] = [];
let MOCK_NOTIFICATIONS: Notification[] = [{ id: 'not1', title: 'Bienvenida', message: 'Bienvenido al sistema UniSystem Pro', read: false, type: 'info', created_at: new Date().toISOString() }];
let MOCK_SCHOLARSHIP_TYPES: ScholarshipType[] = [
  { id: 'st1', name: 'Excelencia Académica', percentage: 100, requirements: 'Promedio > 90' },
  { id: 'st2', name: 'Deportiva', percentage: 50, requirements: 'Pertenecer a selección' },
];
let MOCK_SCHOLARSHIP_APPS: ScholarshipApplication[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- AUTH & CONFIG ---
  getCampuses: async (): Promise<Campus[]> => !USE_MOCK ? request('/campuses') : Promise.resolve(MOCK_CAMPUSES),
  createCampus: async (data: any) => !USE_MOCK ? request('/campuses', { method: 'POST', body: JSON.stringify(data) }) : (MOCK_CAMPUSES.push({ ...data, id: `c${Date.now()}` }), Promise.resolve()),
  updateCampus: async (id: string, data: any) => {
    if (!USE_MOCK) return request(`/campuses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const idx = MOCK_CAMPUSES.findIndex(c => c.id === id);
    if (idx !== -1) MOCK_CAMPUSES[idx] = { ...MOCK_CAMPUSES[idx], ...data };
    return Promise.resolve();
  },
  deleteCampus: async (id: string) => !USE_MOCK ? request(`/campuses/${id}`, { method: 'DELETE' }) : (MOCK_CAMPUSES = MOCK_CAMPUSES.filter(c => c.id !== id), Promise.resolve()),

  login: async (campusId: string, username: string, password?: string): Promise<User | null> => {
    // Send password to backend if not mock
    if (!USE_MOCK) return request('/login', { method: 'POST', body: JSON.stringify({ campusId, username, password }) });

    await delay(300);
    const cleanUsername = username.trim().toLowerCase();
    // In Mock, just check username match for convenience
    return MOCK_USERS.find(u => u.username.toLowerCase() === cleanUsername && u.campus_id === campusId) || null;
  },
  changePassword: async (userId: string, newPass: string) => !USE_MOCK ? request('/auth/change-password', { method: 'POST', body: JSON.stringify({ userId, newPass }) }) : Promise.resolve(true),

  // --- USERS ---
  getUsers: async (campusId: string, role?: Role, search?: string): Promise<User[]> => {
    if (!USE_MOCK) {
      const query = new URLSearchParams({ campusId });
      if (role) query.append('role', role);
      if (search) query.append('search', search);
      return request(`/users?${query.toString()}`);
    }
    let users = MOCK_USERS.filter(u => u.campus_id === campusId);
    if (role) users = users.filter(u => u.role === role);
    if (search) {
      const lower = search.toLowerCase();
      users = users.filter(u =>
        u.full_name.toLowerCase().includes(lower) ||
        u.username.toLowerCase().includes(lower) ||
        u.meta_data?.carnet?.toLowerCase().includes(lower)
      );
    }
    return users;
  },
  createUser: async (user: any) => !USE_MOCK ? request('/users', { method: 'POST', body: JSON.stringify(user) }) : (MOCK_USERS.push({ ...user, id: `u${Date.now()}`, avatar_url: `https://ui-avatars.com/api/?name=${user.full_name}` }), Promise.resolve(MOCK_USERS[MOCK_USERS.length - 1])),
  updateUser: async (id: string, updates: any) => {
    if (!USE_MOCK) return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) { MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates }; }
    return Promise.resolve();
  },
  deleteUser: async (id: string) => !USE_MOCK ? request(`/users/${id}`, { method: 'DELETE' }) : (MOCK_USERS = MOCK_USERS.filter(u => u.id !== id), Promise.resolve()),

  // --- ACADEMIC ---
  getCareers: async (campusId: string) => !USE_MOCK ? request(`/careers?campusId=${campusId}`) : MOCK_CAREERS.filter(c => c.campus_id === campusId),
  createCareer: async (career: any) => !USE_MOCK ? request('/careers', { method: 'POST', body: JSON.stringify(career) }) : (MOCK_CAREERS.push({ ...career, id: `car${Date.now()}` }), Promise.resolve()),
  deleteCareer: async (id: string) => !USE_MOCK ? request(`/careers/${id}`, { method: 'DELETE' }) : (MOCK_CAREERS = MOCK_CAREERS.filter(c => c.id !== id), Promise.resolve()),

  getCourses: async (campusId: string) => {
    if (!USE_MOCK) return request(`/courses?campusId=${campusId}`);
    // Join Career & Professor Data for UI
    return MOCK_COURSES.filter(c => c.campus_id === campusId).map(c => ({
      ...c,
      career: MOCK_CAREERS.find(car => car.id === c.career_id),
      professor_name: MOCK_USERS.find(u => u.id === c.professor_id)?.full_name
    }));
  },
  getProfessorCourses: async (profId: string) => !USE_MOCK ? request(`/courses?professorId=${profId}`) : MOCK_COURSES.filter(c => c.professor_id === profId),
  createCourse: async (course: any) => !USE_MOCK ? request('/courses', { method: 'POST', body: JSON.stringify(course) }) : (MOCK_COURSES.push({ ...course, id: `co${Date.now()}` }), Promise.resolve()),
  deleteCourse: async (id: string) => !USE_MOCK ? request(`/courses/${id}`, { method: 'DELETE' }) : (MOCK_COURSES = MOCK_COURSES.filter(c => c.id !== id), Promise.resolve()),

  // --- ENROLLMENTS & STUDENT DATA ---
  getEnrollments: async (studentId: string) => !USE_MOCK ? request(`/enrollments?studentId=${studentId}`) : MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => ({ ...e, course: MOCK_COURSES.find(c => c.id === e.course_id) })),

  getStudentHistory: async (studentId: string) => {
    if (!USE_MOCK) return request(`/student-history?studentId=${studentId}`);
    const enrollments = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId);
    const courses = MOCK_COURSES;
    return enrollments.map(e => ({
      ...e,
      course: courses.find(c => c.id === e.course_id),
      attendance_rate: 95,
      absences: 2
    }));
  },

  getCourseStudents: async (courseId: string) => {
    if (!USE_MOCK) return request(`/course-students?courseId=${courseId}`);
    return MOCK_ENROLLMENTS.filter(e => e.course_id === courseId).map(e => ({ ...e, student: MOCK_USERS.find(u => u.id === e.student_id)! }));
  },
  enrollStudent: async (studentId: string, courseIds: string[]) => !USE_MOCK ? request('/enrollments/bulk', { method: 'POST', body: JSON.stringify({ studentId, courseIds }) }) : (courseIds.forEach(cid => MOCK_ENROLLMENTS.push({ id: `e${Date.now()}_${cid}`, student_id: studentId, course_id: cid, grade_p1: 0, grade_p2: 0, grade_final: 0, status: 'active' })), Promise.resolve()),
  updateGrade: async (id: string, field: string, value: number) => !USE_MOCK ? request(`/enrollments/${id}`, { method: 'PUT', body: JSON.stringify({ [field]: value }) }) : (MOCK_ENROLLMENTS.find(e => e.id === id)![field as any] = value, Promise.resolve()),

  // --- ATTENDANCE ---
  getAttendance: async (courseId: string, date: string) => !USE_MOCK ? request(`/attendance?courseId=${courseId}&date=${date}`) : MOCK_ATTENDANCE.filter(a => a.course_id === courseId && a.date === date),
  saveAttendance: async (records: any[]) => !USE_MOCK ? request('/attendance', { method: 'POST', body: JSON.stringify(records) }) : (records.forEach(r => {
    const existing = MOCK_ATTENDANCE.findIndex(a => a.student_id === r.student_id && a.date === r.date && a.course_id === r.course_id);
    if (existing !== -1) MOCK_ATTENDANCE[existing] = r; else MOCK_ATTENDANCE.push(r);
  }), Promise.resolve()),

  // --- RESOURCES & NOTES ---
  getResources: async (courseId: string) => !USE_MOCK ? request(`/resources?courseId=${courseId}`) : MOCK_RESOURCES.filter(r => r.course_id === courseId),
  createResource: async (res: any) => !USE_MOCK ? request('/resources', { method: 'POST', body: JSON.stringify(res) }) : (MOCK_RESOURCES.push({ ...res, id: `r${Date.now()}`, created_at: new Date().toISOString() }), Promise.resolve()),
  getNotes: async (studentId: string) => !USE_MOCK ? request(`/notes?studentId=${studentId}`) : MOCK_NOTES.filter(n => n.student_id === studentId),
  createNote: async (note: any) => !USE_MOCK ? request('/notes', { method: 'POST', body: JSON.stringify(note) }) : (MOCK_NOTES.push({ ...note, id: `n${Date.now()}`, created_at: new Date().toISOString() }), Promise.resolve()),
  toggleNoteTask: async (id: string) => !USE_MOCK ? request(`/notes/${id}/toggle`, { method: 'PUT' }) : (Promise.resolve()),

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string) => !USE_MOCK ? request(`/notifications?userId=${userId}`) : MOCK_NOTIFICATIONS,
  sendNotification: async (notif: any) => !USE_MOCK ? request('/notifications', { method: 'POST', body: JSON.stringify(notif) }) : (MOCK_NOTIFICATIONS.unshift({ ...notif, id: `not${Date.now()}` }), Promise.resolve()),

  // --- SCHOLARSHIPS ---
  getScholarshipTypes: async () => !USE_MOCK ? request('/scholarship-types') : MOCK_SCHOLARSHIP_TYPES,
  createScholarshipType: async (t: any) => !USE_MOCK ? request('/scholarship-types', { method: 'POST', body: JSON.stringify(t) }) : (MOCK_SCHOLARSHIP_TYPES.push({ ...t, id: `st${Date.now()}` }), Promise.resolve()),
  updateScholarshipType: async (id: string, t: any) => !USE_MOCK ? request(`/scholarship-types/${id}`, { method: 'PUT', body: JSON.stringify(t) }) : (Object.assign(MOCK_SCHOLARSHIP_TYPES.find(x => x.id === id)!, t), Promise.resolve()),
  deleteScholarshipType: async (id: string) => !USE_MOCK ? request(`/scholarship-types/${id}`, { method: 'DELETE' }) : (MOCK_SCHOLARSHIP_TYPES = MOCK_SCHOLARSHIP_TYPES.filter(x => x.id !== id), Promise.resolve()),

  getScholarshipApplications: async (studentId?: string) => {
    if (!USE_MOCK) { const query = studentId ? `?studentId=${studentId}` : ''; return request(`/scholarship-applications${query}`); }
    return MOCK_SCHOLARSHIP_APPS.map(a => ({ ...a, student_name: 'Mock Student', scholarship_name: MOCK_SCHOLARSHIP_TYPES.find(t => t.id === a.type_id)?.name }));
  },
  applyForScholarship: async (studentId: string, typeId: string, reason: string) => !USE_MOCK ? request('/scholarship-applications', { method: 'POST', body: JSON.stringify({ student_id: studentId, type_id: typeId, status: 'pending' }) }) : (MOCK_SCHOLARSHIP_APPS.push({ id: `sa${Date.now()}`, student_id: studentId, type_id: typeId, status: 'pending' }), Promise.resolve()),
  updateScholarshipStatus: async (id: string, status: string) => !USE_MOCK ? request(`/scholarship-applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }) : (MOCK_SCHOLARSHIP_APPS.find(a => a.id === id)!.status = status as any, Promise.resolve()),

  // --- STATS (Free University Update) ---
  getDashboardStats: async (campusId: string) => {
    if (!USE_MOCK) return request(`/stats/dashboard?campusId=${campusId}`);

    // Free University: Revenue is 0. Show Scholarship stats instead.
    const students = MOCK_USERS.filter(u => u.role === Role.STUDENT && u.campus_id === campusId).length;
    const professors = MOCK_USERS.filter(u => u.role === Role.PROFESSOR && u.campus_id === campusId).length;
    const coursesCount = MOCK_COURSES.filter(c => c.campus_id === campusId).length;

    // Calculate Scholarship Stats
    const approvedScholarships = MOCK_SCHOLARSHIP_APPS.filter(a => a.status === 'approved').length;
    // Estimated "Budget" assigned to scholarships (Mock calculation)
    const scholarshipBudget = approvedScholarships * 500; // Assuming $500 aid per student

    return {
      students,
      professors,
      courses: coursesCount,
      monthlyRevenue: 0, // University is free
      scholarshipsGiven: approvedScholarships,
      scholarshipBudget: scholarshipBudget
    };
  }
};
