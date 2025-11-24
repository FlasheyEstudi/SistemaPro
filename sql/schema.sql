-- UniSystem Pro Database Schema

-- 1. Campuses
CREATE TABLE campuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    theme_color TEXT,
    logo_url TEXT,
    monthly_tuition NUMERIC DEFAULT 150,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (Students, Professors, Admins)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL, -- Should be hashed in production
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT CHECK (role IN ('admin', 'professor', 'student')),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    avatar_url TEXT,
    cover_url TEXT,
    meta_data JSONB, -- Stores extra fields like carnet, specialty, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, campus_id)
);

-- 3. Careers (Academic Programs)
CREATE TABLE careers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Courses
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    career_id UUID REFERENCES careers(id) ON DELETE SET NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    schedule TEXT,
    weight_p1 NUMERIC DEFAULT 30,
    weight_p2 NUMERIC DEFAULT 30,
    weight_final NUMERIC DEFAULT 40,
    period TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enrollments (Student - Course Relation)
CREATE TABLE enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    grade_p1 NUMERIC DEFAULT 0,
    grade_p2 NUMERIC DEFAULT 0,
    grade_final NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 6. Attendance
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Course Resources
CREATE TABLE course_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Notes (Student Personal Notes)
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    sender_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Scholarship Types
CREATE TABLE scholarships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Scholarship Applications
CREATE TABLE scholarship_apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
