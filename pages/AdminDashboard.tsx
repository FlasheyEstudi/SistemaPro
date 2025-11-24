
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen, Plus, Search, FileText, CheckCircle, XCircle, DollarSign, Bell, Send, Trash2, Settings, Edit, Upload, BarChart2, Shield, Printer, Save, Download, Info, Building, Award, ClipboardList, CheckSquare, Target } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../store';
import { User, Role, ScholarshipApplication, Course, Career, Notification, ScholarshipType, Campus, ToastMessage } from '../types';
import { generateProfessionalPDF } from '../utils/pdfGenerator';
import ImageUpload from '../components/ImageUpload';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

interface AdminDashboardProps {
    currentView: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentView }) => {
  const { currentCampus, setCampus } = useStore();
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [scholarshipApps, setScholarshipApps] = useState<ScholarshipApplication[]>([]);
  const [scholarshipTypes, setScholarshipTypes] = useState<ScholarshipType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ students: 0, professors: 0, courses: 0, monthlyRevenue: 0, scholarshipsGiven: 0, scholarshipBudget: 0 });
  const [allCampuses, setAllCampuses] = useState<Campus[]>([]);

  // Enrollment State
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollAvailableCourses, setEnrollAvailableCourses] = useState<Course[]>([]);
  const [enrollSelectedCourses, setEnrollSelectedCourses] = useState<string[]>([]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editScholarship, setEditScholarship] = useState<ScholarshipType | null>(null);
  const [showCampusForm, setShowCampusForm] = useState(false);
  
  // Notification State
  const [notifTargetType, setNotifTargetType] = useState<'all' | 'role' | 'user'>('all');
  const [notifTargetRole, setNotifTargetRole] = useState<Role>(Role.STUDENT);
  const [notifTargetUser, setNotifTargetUser] = useState('');
  const [newNotification, setNewNotification] = useState({ title: '', message: '' });

  // Feedback & Exports
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showExportModal, setShowExportModal] = useState<{ isOpen: boolean, title: string, action: () => void }>({ isOpen: false, title: '', action: () => {} });
  
  // Forms
  const [newUser, setNewUser] = useState<Partial<User>>({ role: Role.STUDENT, meta_data: { address: '', carnet: '', phone: '', cedula: '', mined_id: '' } });
  
  // Period Selection State
  const [periodType, setPeriodType] = useState('Cuatrimestre');
  const [periodNumber, setPeriodNumber] = useState('1');
  const [newCourse, setNewCourse] = useState({ name: '', code: '', career_id: '', professor_id: '', schedule: '', period: '' });
  
  const [newScholarshipType, setNewScholarshipType] = useState({ name: '', percentage: 0, requirements: '' });
  const [campusSettings, setCampusSettings] = useState({ name: '', logo_url: '', monthly_tuition: 0 });
  const [newCampusData, setNewCampusData] = useState({ name: '', logo_url: '', admin_username: '', admin_password: '', monthly_tuition: 0 });

  useEffect(() => {
    loadData();
    if(currentCampus) {
        setCampusSettings({ 
            name: currentCampus.name, 
            logo_url: currentCampus.logo_url || '',
            monthly_tuition: 0 // Gratis
        });
    }
  }, [currentCampus, currentView]);

  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (currentView === 'users' && currentCampus) {
              api.getUsers(currentCampus.id, undefined, searchTerm).then(setUsers);
          }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentCampus, currentView]);

  const loadData = async () => {
    if (!currentCampus) return;
    setLoading(true);
    
    const dashStats = await api.getDashboardStats(currentCampus.id);
    setStats(dashStats as any);

    if (currentView === 'users') {
         const allUsers = await api.getUsers(currentCampus.id);
         setUsers(allUsers);
         const c = await api.getCareers(currentCampus.id);
         setCareers(c);
    } else if (currentView === 'academic') {
        const c = await api.getCourses(currentCampus.id);
        const car = await api.getCareers(currentCampus.id);
        const profs = await api.getUsers(currentCampus.id, Role.PROFESSOR);
        setCourses(c);
        setCareers(car);
        setUsers(profs);
    } else if (currentView === 'enrollment') {
        const c = await api.getCourses(currentCampus.id);
        setCourses(c);
        const st = await api.getUsers(currentCampus.id, Role.STUDENT);
        setUsers(st);
    } else if (currentView === 'scholarships') {
        const apps = await api.getScholarshipApplications();
        const types = await api.getScholarshipTypes();
        setScholarshipApps(apps);
        setScholarshipTypes(types);
    } else if (currentView === 'notifications') {
        // Fetch all users to allow searching for individual target
        const allUsers = await api.getUsers(currentCampus.id);
        setUsers(allUsers);
    } else if (currentView === 'settings') {
        const campuses = await api.getCampuses();
        setAllCampuses(campuses);
    }
    setLoading(false);
  };

  // --- ACTIONS ---

  const confirmExport = (title: string, action: () => void) => {
      setShowExportModal({ isOpen: true, title, action });
  };

  const handleExportAction = () => {
      showExportModal.action();
      setShowExportModal({ ...showExportModal, isOpen: false });
      setToast({ type: 'success', title: 'Descargando...', message: 'Tu archivo se está generando.' });
  };

  const exportUserList = () => {
      if(!currentCampus) return;
      const data = users.map(u => [
          u.full_name,
          u.username,
          u.role.toUpperCase(),
          u.meta_data?.carnet || u.meta_data?.cedula || 'N/A',
          u.email
      ]);
      generateProfessionalPDF(
          {
              title: 'Reporte de Usuarios Registrados',
              filename: 'Usuarios.pdf',
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
          },
          ['Nombre', 'Usuario', 'Rol', 'ID/Carnet', 'Email'],
          data
      );
  };

  const exportPensum = (career: Career) => {
      if(!currentCampus) return;
      const careerCourses = courses.filter(c => c.career_id === career.id);
      // Sort by period to make it look organized
      careerCourses.sort((a, b) => a.period.localeCompare(b.period));
      
      const data = careerCourses.map(c => [
          c.code,
          c.name,
          c.period,
          `${c.weight_p1}% / ${c.weight_p2}% / ${c.weight_final}%`,
          c.schedule || 'Por definir'
      ]);

      generateProfessionalPDF(
          {
              title: `Pensum Académico - ${career.name}`,
              filename: `Pensum_${career.code}.pdf`,
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userInfo: [`Código Carrera: ${career.code}`, `Total Asignaturas: ${careerCourses.length}`]
          },
          ['Código', 'Asignatura', 'Periodo', 'Eval (P1/P2/F)', 'Horario Ref'],
          data
      );
  };

  const exportEnrollmentReceipt = async (studentId: string, enrolledCourseIds: string[]) => {
      if(!currentCampus) return;
      const student = users.find(u => u.id === studentId);
      const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
      
      const data = enrolledCourses.map(c => [
          c.code,
          c.name,
          c.period,
          c.schedule || 'N/A'
      ]);

      generateProfessionalPDF(
          {
              title: 'Comprobante de Matrícula',
              filename: `Matricula_${student?.username}.pdf`,
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userName: student?.full_name,
              userInfo: [
                  `Carnet: ${student?.meta_data?.carnet}`,
                  `Carrera: ${student?.meta_data?.career_name || 'General'}`,
                  `Fecha: ${new Date().toLocaleDateString()}`
              ]
          },
          ['Código', 'Asignatura', 'Periodo', 'Horario'],
          data
      );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampus) return;
    
    const email = `${newUser.username}@${newUser.role === Role.STUDENT ? 'est' : 'doc'}.uni.edu`;
    const careerName = careers.find(c => c.id === newUser.meta_data?.career_id)?.name;

    const createdUser = await api.createUser({
        full_name: newUser.full_name,
        username: newUser.username,
        password: newUser.password, 
        email: email,
        role: newUser.role,
        campus_id: currentCampus.id,
        avatar_url: `https://ui-avatars.com/api/?name=${newUser.full_name}`,
        meta_data: { 
            ...newUser.meta_data, 
            career_name: careerName
        }
    });

    if (newUser.role === Role.STUDENT || newUser.role === Role.PROFESSOR) {
        // Generate Welcome Sheet PDF
        const title = newUser.role === Role.STUDENT ? 'Ficha de Matrícula Inicial' : 'Ficha de Personal Docente';
        const info = newUser.role === Role.STUDENT 
            ? [`Carnet: ${newUser.meta_data?.carnet}`, `Carrera: ${careerName}`]
            : [`Especialidad: ${newUser.meta_data?.specialty}`, `ID Docente: ${newUser.meta_data?.cedula}`];
            
        generateProfessionalPDF(
            {
                title: title,
                filename: `Ficha_${createdUser.username}.pdf`,
                logoUrl: currentCampus.logo_url,
                campusName: currentCampus.name,
                userName: createdUser.full_name,
                userInfo: info
            },
            ['Campo', 'Detalle'],
            [
                ['Nombre Completo', createdUser.full_name],
                ['Documento Identidad', newUser.meta_data?.cedula || '---'],
                ['Usuario de Acceso', newUser.username],
                ['Contraseña Temporal', newUser.password || '****'],
                ['Fecha Registro', new Date().toLocaleDateString()]
            ]
        );
    }
    setToast({ type: 'success', title: 'Usuario Creado', message: 'Se ha generado la ficha de registro.' });
    setShowUserForm(false);
    setNewUser({ role: Role.STUDENT, meta_data: {} }); 
    loadData();
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentCampus) return;
      const fullPeriod = `${periodType} ${periodNumber}`;
      await api.createCourse({ ...newCourse, period: fullPeriod, campus_id: currentCampus.id, weight_p1: 30, weight_p2: 30, weight_final: 40 });
      setShowCourseForm(false);
      setToast({ type: 'success', title: 'Asignatura Creada', message: 'El curso se agregó al pensum.' });
      loadData();
  };

  const handleEnrollStudent = async () => {
      if(!enrollStudentId || enrollSelectedCourses.length === 0) return;
      await api.enrollStudent(enrollStudentId, enrollSelectedCourses);
      
      if(window.confirm('Matrícula exitosa. ¿Desea descargar el comprobante?')) {
          await exportEnrollmentReceipt(enrollStudentId, enrollSelectedCourses);
      }
      
      setEnrollSelectedCourses([]);
      setToast({ type: 'success', title: 'Matrícula Realizada', message: 'El alumno ha sido inscrito.' });
  };

  const onSelectStudentForEnrollment = async (studentId: string) => {
      setEnrollStudentId(studentId);
      setEnrollSelectedCourses([]);
      if(!studentId) {
          setEnrollAvailableCourses([]);
          return;
      }
      const student = users.find(u => u.id === studentId);
      const studentEnrollments = await api.getEnrollments(studentId);
      const available = courses.filter(c => {
          const isEnrolled = studentEnrollments.find((e: any) => e.course_id === c.id);
          const matchesCareer = student?.meta_data?.career_id ? c.career_id === student.meta_data.career_id : true;
          return !isEnrolled && matchesCareer;
      });
      setEnrollAvailableCourses(available);
  };

  const handleCreateCampus = async () => {
      await api.createCampus(newCampusData);
      setToast({ type: 'success', title: 'Recinto Creado', message: 'Configuración inicial completa.' });
      setShowCampusForm(false);
      setNewCampusData({ name: '', logo_url: '', admin_username: '', admin_password: '', monthly_tuition: 0 });
      loadData();
  };

  const handleDeleteCampus = async (id: string) => {
      if (window.confirm("¿Está seguro de eliminar este recinto? Esta acción borrará todos los datos asociados.")) {
          await api.deleteCampus(id);
          if (currentCampus?.id === id) window.location.reload(); else loadData();
      }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentCampus) return;

      const payload = {
          ...newNotification,
          type: 'info',
          sender_name: 'Administración',
          target_type: notifTargetType,
          target_id: notifTargetType === 'role' ? notifTargetRole : notifTargetType === 'user' ? notifTargetUser : null,
          campus_id: currentCampus.id
      };

      await api.sendNotification(payload);
      
      setNewNotification({ title: '', message: '' });
      setNotifTargetType('all');
      setNotifTargetUser('');
      setToast({ type: 'success', title: 'Aviso Enviado', message: 'Notificación publicada con éxito.' });
  };

  const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
      let pass = "";
      for(let i=0; i<8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      setNewUser({...newUser, password: pass});
  };

  // --- VIEWS ---

  const EnrollmentTab = () => (
      <div className="space-y-6 fade-in-up">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600"/> Matrícula Administrativa</h3>
              <p className="text-sm text-gray-500 mb-6">Inscribir manualmente asignaturas a un estudiante.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Seleccionar Estudiante</label>
                      <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" value={enrollStudentId} onChange={e => onSelectStudentForEnrollment(e.target.value)}>
                          <option value="">-- Buscar Alumno --</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.meta_data?.carnet})</option>)}
                      </select>

                      {enrollStudentId && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                      {users.find(u=>u.id===enrollStudentId)?.full_name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900">{users.find(u=>u.id===enrollStudentId)?.full_name}</p>
                                      <p className="text-xs text-gray-500">{users.find(u=>u.id===enrollStudentId)?.meta_data?.career_name}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Asignaturas Disponibles</label>
                      <div className="border border-gray-200 rounded-xl max-h-[400px] overflow-y-auto bg-white">
                          {enrollAvailableCourses.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Seleccione un alumno para ver oferta académica.</p>}
                          {enrollAvailableCourses.map(c => (
                              <div key={c.id} 
                                   onClick={() => setEnrollSelectedCourses(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                                   className={`p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${enrollSelectedCourses.includes(c.id) ? 'bg-blue-50' : ''}`}>
                                  <div>
                                      <p className="font-bold text-sm text-gray-800">{c.name}</p>
                                      <p className="text-xs text-gray-500">{c.code} • {c.period}</p>
                                  </div>
                                  {enrollSelectedCourses.includes(c.id) ? <CheckSquare size={18} className="text-blue-600"/> : <div className="w-4 h-4 border border-gray-300 rounded"/>}
                              </div>
                          ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                          <button disabled={enrollSelectedCourses.length === 0} onClick={handleEnrollStudent} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 hover:bg-blue-700 transition-all">
                              Confirmar Matrícula ({enrollSelectedCourses.length})
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 relative">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      
      {currentView === 'overview' && (
           <div className="space-y-6 fade-in-up">
                <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase">Estudiantes</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.students}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase">Docentes</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.professors}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase">Becas Otorgadas</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.scholarshipsGiven}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-3xl shadow-lg text-white">
                        <p className="text-blue-300 text-xs font-bold uppercase">Presupuesto Becas</p>
                        <h3 className="text-3xl font-bold mt-2">${stats.scholarshipBudget.toLocaleString()}</h3>
                    </div>
                </div>
           </div>
      )}
      
      {currentView === 'users' && (
          <div className="space-y-6 fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
                  <div className="relative w-full md:w-auto">
                      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input type="text" placeholder="Buscar por nombre, carnet..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full md:w-80 bg-white text-gray-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                       <button onClick={() => confirmExport('Lista de Usuarios', exportUserList)} className="bg-gray-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 shadow-md">
                          <Download size={18} /> Exportar
                       </button>
                       <button onClick={() => setShowUserForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-md">
                          <Plus size={18} /> Nuevo
                       </button>
                  </div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">ID/Carnet</th><th className="px-6 py-4">Rol</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={u.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                                        <div><p className="font-bold text-gray-900 text-sm">{u.full_name}</p><p className="text-xs text-gray-400">{u.username}</p></div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.meta_data?.carnet || u.meta_data?.cedula || 'N/A'}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 uppercase`}>{u.role}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {currentView === 'academic' && (
        <div className="space-y-6 fade-in-up">
            <div className="flex justify-end mb-4">
                 <button onClick={() => setShowCourseForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-blue-700">
                    <Plus size={16} /> Crear Asignatura
                </button>
            </div>
            {careers.map(career => {
                const careerCourses = courses.filter(c => c.career_id === career.id);
                if(careerCourses.length === 0) return null;
                const periods = Array.from(new Set(careerCourses.map(c => c.period))).sort();

                return (
                    <div key={career.id} className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm mb-6">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-800">{career.name}</h4>
                                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{career.code}</span>
                            </div>
                            <button onClick={() => confirmExport(`Pensum ${career.name}`, () => exportPensum(career))} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-50">
                                <Download size={14}/> Descargar Pensum
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {periods.map(period => (
                                <div key={period} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b border-gray-200 pb-2">{period}</h5>
                                    {careerCourses.filter(c => c.period === period).map(c => (
                                        <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-2 flex justify-between">
                                            <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                                            <p className="text-[10px] text-gray-500">{c.code}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {currentView === 'enrollment' && <EnrollmentTab />}
      
      {currentView === 'scholarships' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-up">
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
               <h3 className="font-bold text-gray-900 mb-4">Solicitudes Recientes</h3>
               <div className="space-y-3">
                    {scholarshipApps.map(app => (
                        <div key={app.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-800">{app.student_name}</h4>
                                <p className="text-xs text-blue-600 font-bold">{app.scholarship_name}</p>
                            </div>
                            {app.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button onClick={() => api.updateScholarshipStatus(app.id, 'approved').then(loadData)} className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">Aprobar</button>
                                    <button onClick={() => api.updateScholarshipStatus(app.id, 'rejected').then(loadData)} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">Rechazar</button>
                                </div>
                            ) : <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-100 rounded">{app.status}</span>}
                        </div>
                    ))}
               </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Tipos de Beca</h3>
              <div className="space-y-3">
                  {scholarshipTypes.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-gray-50">
                          <div><p className="font-bold text-gray-800 text-sm">{t.name}</p><p className="text-xs text-gray-500">{t.percentage}%</p></div>
                          <div className="flex gap-1">
                              <button onClick={() => setEditScholarship(t)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit size={16}/></button>
                              <button onClick={() => { if(window.confirm('Eliminar?')) api.deleteScholarshipType(t.id).then(loadData) }} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      )}

      {currentView === 'notifications' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 fade-in-up max-w-2xl mx-auto">
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2"><Bell size={24} className="text-blue-600"/> Centro de Notificaciones</h3>
              
              <form onSubmit={handleSendNotification} className="space-y-6">
                  {/* Destinatarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1"><Target size={12}/> Tipo de Destinatario</label>
                          <select 
                              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition-colors"
                              value={notifTargetType}
                              onChange={e => setNotifTargetType(e.target.value as any)}
                          >
                              <option value="all">Global (Todos)</option>
                              <option value="role">Por Rol (Grupo)</option>
                              <option value="user">Individual (Usuario)</option>
                          </select>
                      </div>

                      {notifTargetType === 'role' && (
                          <div className="slide-up">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Seleccionar Rol</label>
                              <select 
                                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900"
                                  value={notifTargetRole}
                                  onChange={e => setNotifTargetRole(e.target.value as Role)}
                              >
                                  <option value={Role.STUDENT}>Estudiantes</option>
                                  <option value={Role.PROFESSOR}>Profesores</option>
                                  <option value={Role.ADMIN}>Administrativos</option>
                              </select>
                          </div>
                      )}

                      {notifTargetType === 'user' && (
                          <div className="slide-up">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Buscar Usuario</label>
                              <input 
                                  list="users-list"
                                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900"
                                  placeholder="Escriba nombre o carnet..."
                                  value={notifTargetUser}
                                  onChange={e => setNotifTargetUser(e.target.value)}
                              />
                              <datalist id="users-list">
                                  {users.map(u => (
                                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                                  ))}
                              </datalist>
                          </div>
                      )}
                  </div>

                  {/* Mensaje */}
                  <div>
                      <input required className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-bold mb-4" placeholder="Título del Aviso" value={newNotification.title} onChange={e => setNewNotification({...newNotification, title: e.target.value})} />
                      <textarea required className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 h-32 text-gray-900 resize-none" placeholder="Escriba el mensaje aquí..." value={newNotification.message} onChange={e => setNewNotification({...newNotification, message: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95">
                      <Send size={20}/> Publicar Notificación
                  </button>
              </form>
          </div>
      )}

      {currentView === 'settings' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in-up">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-xl mb-4 text-gray-900">Configuración del Recinto</h3>
                <input className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4 text-gray-900" value={campusSettings.name} onChange={e => setCampusSettings({...campusSettings, name: e.target.value})} />
                <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <ImageUpload label="Logo Institucional" currentImage={campusSettings.logo_url} onImageChange={url => setCampusSettings({...campusSettings, logo_url: url})} shape="rect" />
                </div>
                <button onClick={() => { api.updateCampus(currentCampus!.id, campusSettings); setToast({type:'success', title: 'Guardado', message: 'Configuración actualizada.'}); }} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold">Guardar</button>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Administración de Recintos</h3>
                    <button onClick={() => setShowCampusForm(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Plus size={20}/></button>
                </div>
                {allCampuses.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl mb-2">
                        <p className="font-bold text-sm text-gray-800">{c.name}</p>
                        {c.id !== currentCampus?.id && <button onClick={() => handleDeleteCampus(c.id)} className="text-red-500"><Trash2 size={16}/></button>}
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* --- MODALS --- */}
      {showUserForm && (
        <Modal isOpen={true} onClose={() => setShowUserForm(false)} title="Nuevo Usuario">
            <form onSubmit={handleCreateUser} className="space-y-4">
                <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Nombre Completo" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
                <select className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                    <option value={Role.STUDENT}>Estudiante</option>
                    <option value={Role.PROFESSOR}>Profesor</option>
                    <option value={Role.ADMIN}>Administrador</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Usuario" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                    <div className="relative">
                        <input required className="w-full p-3 border border-gray-200 rounded-xl pr-10 text-gray-900" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        <button type="button" onClick={generatePassword} className="absolute right-2 top-2 p-1.5 bg-gray-200 rounded-lg text-xs font-bold"><Settings size={14}/></button>
                    </div>
                </div>
                {/* Campos Extra según Rol */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Información Adicional</p>
                    <input className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Cédula / DNI" value={newUser.meta_data?.cedula} onChange={e => setNewUser({...newUser, meta_data: {...newUser.meta_data, cedula: e.target.value}})} />
                    {newUser.role === Role.STUDENT && (
                        <>
                            <input className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Carnet Estudiantil" value={newUser.meta_data?.carnet} onChange={e => setNewUser({...newUser, meta_data: {...newUser.meta_data, carnet: e.target.value}})} />
                            <select className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newUser.meta_data?.career_id} onChange={e => setNewUser({...newUser, meta_data: {...newUser.meta_data, career_id: e.target.value}})}>
                                <option value="">Seleccionar Carrera...</option>
                                {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
                </div>
            </form>
        </Modal>
      )}

      {showCourseForm && (
        <Modal isOpen={true} onClose={() => setShowCourseForm(false)} title="Nueva Asignatura">
             <form onSubmit={handleCreateCourse} className="space-y-4">
                 <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Nombre Asignatura" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} />
                 <div className="grid grid-cols-2 gap-4">
                      <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Código" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} />
                      <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Horario" value={newCourse.schedule} onChange={e => setNewCourse({...newCourse, schedule: e.target.value})} />
                 </div>
                 <select required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newCourse.career_id} onChange={e => setNewCourse({...newCourse, career_id: e.target.value})}>
                    <option value="">Carrera...</option>
                    {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <div className="flex gap-2">
                     <select className="p-3 border border-gray-200 rounded-xl w-2/3 text-gray-900" value={periodType} onChange={e => setPeriodType(e.target.value)}>
                         <option value="Cuatrimestre">Cuatrimestre</option>
                         <option value="Semestre">Semestre</option>
                         <option value="Año">Año</option>
                     </select>
                     <input type="number" min="1" className="p-3 border border-gray-200 rounded-xl w-1/3 text-center text-gray-900" value={periodNumber} onChange={e => setPeriodNumber(e.target.value)} />
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Crear Asignatura</button>
             </form>
        </Modal>
      )}

      {editScholarship && (
        <Modal isOpen={true} onClose={() => setEditScholarship(null)} title="Editar Beca">
             <form onSubmit={(e) => { e.preventDefault(); api.updateScholarshipType(editScholarship.id, editScholarship).then(loadData); setEditScholarship(null); }} className="space-y-4">
                 <input className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={editScholarship.name} onChange={e => setEditScholarship({...editScholarship, name: e.target.value})} />
                 <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={editScholarship.percentage} onChange={e => setEditScholarship({...editScholarship, percentage: Number(e.target.value)})} />
                 <textarea className="w-full p-3 border border-gray-200 rounded-xl h-24 text-gray-900" value={editScholarship.requirements} onChange={e => setEditScholarship({...editScholarship, requirements: e.target.value})} />
                 <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Guardar</button>
             </form>
        </Modal>
      )}
      
      {showCampusForm && (
          <Modal isOpen={true} onClose={() => setShowCampusForm(false)} title="Crear Recinto">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCampus(); }} className="space-y-4">
                  <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newCampusData.name} onChange={e => setNewCampusData({...newCampusData, name: e.target.value})} placeholder="Nombre del Campus" />
                  <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newCampusData.admin_username} onChange={e => setNewCampusData({...newCampusData, admin_username: e.target.value})} placeholder="Usuario Administrador" />
                  <input required className="w-full p-3 border border-gray-200 rounded-xl text-gray-900" value={newCampusData.admin_password} onChange={e => setNewCampusData({...newCampusData, admin_password: e.target.value})} placeholder="Contraseña Administrador" />
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Crear</button>
              </form>
          </Modal>
      )}

      {/* Export Confirmation Modal */}
      <Modal isOpen={showExportModal.isOpen} onClose={() => setShowExportModal({...showExportModal, isOpen: false})} title="Descargar Documento" type="default"
              footer={
                <>
                  <button onClick={() => setShowExportModal({...showExportModal, isOpen: false})} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button onClick={handleExportAction} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black shadow-lg shadow-gray-200 flex items-center gap-2"><Download size={16}/> Descargar PDF</button>
                </>
              }
      >
        <p>¿Deseas generar y descargar el reporte <strong>"{showExportModal.title}"</strong>?</p>
      </Modal>

    </div>
  );
};

export default AdminDashboard;
