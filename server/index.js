
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para respuestas estandarizadas
const sendResponse = (res, { data, error }, status = 200) => {
  if (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
  res.status(status).json(data);
};

// --- ROUTES ---

// 1. AUTH & CAMPUS MANAGEMENT
app.get('/api/campuses', async (req, res) => {
  const result = await supabase.from('campuses').select('*');
  sendResponse(res, result);
});

app.post('/api/campuses', async (req, res) => {
  const { name, theme_color, logo_url, admin_username, admin_password, monthly_tuition } = req.body;

  const { data: campus, error: cError } = await supabase
    .from('campuses')
    .insert([{ name, theme_color, logo_url, monthly_tuition: monthly_tuition || 150 }])
    .select()
    .single();

  if (cError) return res.status(500).json({ error: cError.message });

  const { data: user, error: uError } = await supabase
    .from('users')
    .insert([{
      username: admin_username,
      password: admin_password, // Store password (should be hashed in prod)
      full_name: `Admin ${name}`,
      email: `admin@${name.replace(/\s+/g, '').toLowerCase()}.edu`,
      role: 'admin',
      campus_id: campus.id,
      avatar_url: `https://ui-avatars.com/api/?name=${name}+Admin`
    }])
    .select()
    .single();

  if (uError) {
    await supabase.from('campuses').delete().eq('id', campus.id);
    return res.status(500).json({ error: uError.message });
  }

  res.status(201).json({ campus, adminUser: user });
});

app.put('/api/campuses/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const result = await supabase.from('campuses').update(updates).eq('id', id).select().single();
  sendResponse(res, result);
});

app.delete('/api/campuses/:id', async (req, res) => {
  const { id } = req.params;
  // Cascade delete handles users, courses, etc if configured in DB
  const result = await supabase.from('campuses').delete().eq('id', id);
  sendResponse(res, result);
});

app.post('/api/login', async (req, res) => {
  const { campusId, username, password } = req.body;

  // SECURITY FIX: Check password
  const result = await supabase
    .from('users')
    .select('*, campuses(*)')
    .eq('campus_id', campusId)
    .eq('username', username)
    .eq('password', password) // Basic check
    .single();

  if (result.error || !result.data) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  res.json(result.data);
});

app.post('/api/auth/change-password', async (req, res) => {
  const { userId, newPass } = req.body;
  const result = await supabase.from('users').update({ password: newPass }).eq('id', userId);
  sendResponse(res, result);
});

// 2. USERS
app.get('/api/users', async (req, res) => {
  const { campusId, role, search } = req.query;
  let query = supabase.from('users').select('*').eq('campus_id', campusId);
  if (role) query = query.eq('role', role);
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
  }
  sendResponse(res, await query);
});

app.post('/api/users', async (req, res) => {
  const user = req.body;
  const result = await supabase.from('users').insert([user]).select().single();
  sendResponse(res, result, 201);
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const result = await supabase.from('users').update(updates).eq('id', id).select().single();
  sendResponse(res, result);
});

// 3. ACADEMIC
app.get('/api/careers', async (req, res) => {
  const { campusId } = req.query;
  const result = await supabase.from('careers').select('*').eq('campus_id', campusId);
  sendResponse(res, result);
});

app.post('/api/careers', async (req, res) => {
  const career = req.body;
  const result = await supabase.from('careers').insert([career]).select().single();
  sendResponse(res, result, 201);
});

app.get('/api/courses', async (req, res) => {
  const { campusId, professorId } = req.query;
  let query = supabase.from('courses').select('*, careers(name), professor:users(full_name)');
  if (campusId) query = query.eq('campus_id', campusId);
  if (professorId) query = query.eq('professor_id', professorId);

  const result = await query;
  if (result.data) {
    // Flatten professor name for easier UI usage
    const flat = result.data.map(c => ({ ...c, professor_name: c.professor?.full_name }));
    return res.json(flat);
  }
  sendResponse(res, result);
});

app.post('/api/courses', async (req, res) => {
  const course = req.body;
  const result = await supabase.from('courses').insert([course]).select().single();
  sendResponse(res, result, 201);
});

// 4. ENROLLMENTS & HISTORY
app.get('/api/enrollments', async (req, res) => {
  const { studentId } = req.query;
  const result = await supabase
    .from('enrollments')
    .select('*, courses(*, professor:users(full_name))')
    .eq('student_id', studentId);
  sendResponse(res, result);
});

app.get('/api/student-history', async (req, res) => {
  const { studentId } = req.query;

  // Obtener notas
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(code, name, schedule)')
    .eq('student_id', studentId);

  // Obtener asistencia (resumen)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId);

  if (!enrollments) return res.json([]);

  // Combinar datos
  const history = enrollments.map(e => {
    const courseAttendance = attendance ? attendance.filter(a => a.course_id === e.course_id) : [];
    const absences = courseAttendance.filter(a => a.status === 'absent').length;
    return {
      ...e,
      absences,
      attendance_rate: courseAttendance.length > 0
        ? Math.round(((courseAttendance.length - absences) / courseAttendance.length) * 100)
        : 100
    };
  });

  res.json(history);
});

app.get('/api/course-students', async (req, res) => {
  const { courseId } = req.query;
  const result = await supabase
    .from('enrollments')
    .select('*, student:users(*)')
    .eq('course_id', courseId);
  sendResponse(res, result);
});

app.post('/api/enrollments/bulk', async (req, res) => {
  const { studentId, courseIds } = req.body;
  const enrollments = courseIds.map(cid => ({
    student_id: studentId,
    course_id: cid,
    grade_p1: 0, grade_p2: 0, grade_final: 0,
    status: 'active'
  }));
  const result = await supabase.from('enrollments').insert(enrollments).select();
  sendResponse(res, result, 201);
});

app.put('/api/enrollments/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const result = await supabase.from('enrollments').update(updates).eq('id', id).select();
  sendResponse(res, result);
});

// 5. ATTENDANCE
app.get('/api/attendance', async (req, res) => {
  const { courseId, date } = req.query;
  const result = await supabase.from('attendance').select('*').eq('course_id', courseId).eq('date', date);
  sendResponse(res, result);
});

app.post('/api/attendance', async (req, res) => {
  const records = req.body;
  if (!records || records.length === 0) return res.status(400).send('No records');
  const { course_id, date } = records[0];
  await supabase.from('attendance').delete().eq('course_id', course_id).eq('date', date);
  const result = await supabase.from('attendance').insert(records).select();
  sendResponse(res, result);
});

// 6. RESOURCES
app.get('/api/resources', async (req, res) => {
  const { courseId } = req.query;
  const result = await supabase.from('course_resources').select('*').eq('course_id', courseId);
  sendResponse(res, result);
});

app.post('/api/resources', async (req, res) => {
  const result = await supabase.from('course_resources').insert([req.body]).select().single();
  sendResponse(res, result, 201);
});

// 7. NOTES
app.get('/api/notes', async (req, res) => {
  const { studentId } = req.query;
  const result = await supabase.from('notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  sendResponse(res, result);
});

app.post('/api/notes', async (req, res) => {
  const result = await supabase.from('notes').insert([req.body]).select().single();
  sendResponse(res, result, 201);
});

app.put('/api/notes/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { data: note } = await supabase.from('notes').select('is_completed').eq('id', id).single();
  const result = await supabase.from('notes').update({ is_completed: !note.is_completed }).eq('id', id).select().single();
  sendResponse(res, result);
});

// 8. NOTIFICATIONS
app.get('/api/notifications', async (req, res) => {
  // If global is passed, we might change logic, but for now fetch all descending
  const { userId } = req.query;
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const result = await query;
  sendResponse(res, result);
});

app.post('/api/notifications', async (req, res) => {
  const { title, message, type, sender_name, target_type, target_id, campus_id } = req.body;

  let userIds = [];

  // Determine recipients
  if (target_type === 'all') {
    const { data } = await supabase.from('users').select('id').eq('campus_id', campus_id);
    userIds = data.map(u => u.id);
  } else if (target_type === 'role') {
    const { data } = await supabase.from('users').select('id').eq('campus_id', campus_id).eq('role', target_id);
    userIds = data.map(u => u.id);
  } else if (target_type === 'user') {
    userIds = [target_id];
  }

  if (userIds.length === 0) return res.status(400).json({ error: 'No recipients found' });

  // Bulk Insert
  const notifications = userIds.map(uid => ({
    user_id: uid,
    title,
    message,
    type,
    sender_name,
    read: false,
    created_at: new Date().toISOString()
  }));

  const result = await supabase.from('notifications').insert(notifications);

  if (result.error) return res.status(500).json({ error: result.error.message });
  res.status(201).json({ count: userIds.length, message: 'Notifications sent' });
});

// 9. SCHOLARSHIPS
app.get('/api/scholarship-types', async (req, res) => {
  const result = await supabase.from('scholarships').select('*');
  sendResponse(res, result);
});

app.post('/api/scholarship-types', async (req, res) => {
  const result = await supabase.from('scholarships').insert([req.body]).select().single();
  sendResponse(res, result, 201);
});

app.put('/api/scholarship-types/:id', async (req, res) => {
  const { id } = req.params;
  const result = await supabase.from('scholarships').update(req.body).eq('id', id).select().single();
  sendResponse(res, result);
});

app.delete('/api/scholarship-types/:id', async (req, res) => {
  const { id } = req.params;
  const result = await supabase.from('scholarships').delete().eq('id', id);
  sendResponse(res, result);
});

app.get('/api/scholarship-applications', async (req, res) => {
  const { studentId } = req.query;
  let query = supabase.from('scholarship_apps').select('*, student:users(full_name), type:scholarships(name, percentage)');
  if (studentId) query = query.eq('student_id', studentId);

  const result = await query;
  if (result.data) {
    const flatData = result.data.map(app => ({
      ...app,
      student_name: app.student?.full_name,
      scholarship_name: app.type?.name,
      percentage: app.type?.percentage
    }));
    return res.json(flatData);
  }
  sendResponse(res, result);
});

app.post('/api/scholarship-applications', async (req, res) => {
  const result = await supabase.from('scholarship_apps').insert([req.body]).select().single();
  sendResponse(res, result, 201);
});

app.put('/api/scholarship-applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await supabase.from('scholarship_apps').update({ status }).eq('id', id).select().single();
  sendResponse(res, result);
});

// 10. STATS (Dynamic Revenue)
app.get('/api/stats/dashboard', async (req, res) => {
  const { campusId } = req.query;

  // Get Tuition Cost
  const { data: campus } = await supabase.from('campuses').select('monthly_tuition').eq('id', campusId).single();
  const tuition = campus ? campus.monthly_tuition : 150;

  const [students, professors, courses, scholarships] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }).eq('campus_id', campusId).eq('role', 'student'),
    supabase.from('users').select('id', { count: 'exact' }).eq('campus_id', campusId).eq('role', 'professor'),
    supabase.from('courses').select('id', { count: 'exact' }).eq('campus_id', campusId),
    supabase.from('scholarship_apps').select('id', { count: 'exact' }).eq('status', 'approved')
  ]);

  const scholarshipsGiven = scholarships.count || 0;
  const scholarshipBudget = scholarshipsGiven * 500; // Estimated

  res.json({
    students: students.count || 0,
    professors: professors.count || 0,
    courses: courses.count || 0,
    monthlyRevenue: (students.count || 0) * tuition,
    scholarshipsGiven,
    scholarshipBudget
  });
});

app.listen(port, () => {
  console.log(`UniSystem Server running on port ${port}`);
});
