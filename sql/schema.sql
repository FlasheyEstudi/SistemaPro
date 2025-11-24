-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Campuses
CREATE TABLE IF NOT EXISTS campuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    theme_color TEXT DEFAULT 'blue',
    monthly_tuition NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'student')),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    avatar_url TEXT,
    cover_url TEXT,
    password TEXT NOT NULL, -- In production, this should be hashed
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, campus_id)
);

-- 3. Careers
CREATE TABLE IF NOT EXISTS careers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    career_id UUID REFERENCES careers(id) ON DELETE SET NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    schedule TEXT,
    period TEXT,
    weight_p1 NUMERIC DEFAULT 30,
    weight_p2 NUMERIC DEFAULT 30,
    weight_final NUMERIC DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    grade_p1 NUMERIC DEFAULT 0,
    grade_p2 NUMERIC DEFAULT 0,
    grade_final NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 6. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Scholarship Applications
CREATE TABLE IF NOT EXISTS scholarship_apps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    sender_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Course Resources
CREATE TABLE IF NOT EXISTS course_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    file_data TEXT, -- Base64 or large text content
    type TEXT NOT NULL,
    target_type TEXT DEFAULT 'all',
    target_student_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_task BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Optional: Enable RLS for better security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DATOS INICIALES (SEED DATA)
-- ==========================================

-- Limpiar datos anteriores para evitar duplicados al reiniciar
TRUNCATE TABLE users, campuses, courses, enrollments, careers, attendance, scholarships, scholarship_apps, notifications, course_resources, notes CASCADE;

-- 1. Crear Campus Principal
INSERT INTO campuses (name, theme_color, monthly_tuition)
VALUES ('Campus Principal', 'blue', 0);

-- 2. Crear Usuario Admin vinculado al campus
DO $$
DECLARE
  campus_id uuid;
BEGIN
  SELECT id INTO campus_id FROM campuses LIMIT 1;
  
  INSERT INTO users (username, password, full_name, email, role, campus_id)
  VALUES 
  ('admin', '123456', 'Director General', 'admin@uni.edu', 'admin', campus_id);
END $$;
