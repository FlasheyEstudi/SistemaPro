
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useStore } from '../store';
import { Course, Enrollment, Attendance, Resource, User, ToastMessage, Notification } from '../types';
import { Save, Calendar, Clock, Paperclip, Video, FileText, Plus, Link as LinkIcon, Download, Mail, Phone, Edit2, CheckSquare, Image as ImageIcon, Briefcase, Lock, Bell, Monitor } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import Modal from '../components/Modal';
import { generateProfessionalPDF } from '../utils/pdfGenerator';
import Toast from '../components/Toast';

interface ProfessorDashboardProps {
    currentView: string;
}

const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ currentView }) => {
  const { currentUser, setUser, currentCampus } = useStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [students, setStudents] = useState<(Enrollment & { student: any })[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings & Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  
  // Resources
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newResource, setNewResource] = useState<{title: string, url: string, type: 'pdf'|'link'|'image'|'assignment'|'video', file_data?: string, target_type: 'current'|'all'|'student', target_student_id?: string}>({ 
      title: '', url: '', type: 'pdf', target_type: 'current' 
  });
  
  // Feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showExportModal, setShowExportModal] = useState<{ isOpen: boolean, title: string, action: () => void }>({ isOpen: false, title: '', action: () => {} });

  useEffect(() => {
    if (currentUser) {
      setProfileData(currentUser);
      api.getProfessorCourses(currentUser.id).then(data => {
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0].id);
      });
      // Load Notifications
      api.getNotifications(currentUser.id).then(setNotifications);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCourse && currentView !== 'overview' && currentView !== 'settings' && currentView !== 'notifications') {
      loadCourseData();
    }
  }, [selectedCourse, attendanceDate, currentView]);

  const loadCourseData = async () => {
      if(!selectedCourse) return;
      const enrolledStudents = await api.getCourseStudents(selectedCourse);
      setStudents(enrolledStudents);

      if (currentView === 'attendance') {
          const records = await api.getAttendance(selectedCourse, attendanceDate);
          setAttendanceData(records);
      } else if (currentView === 'resources') {
          const res = await api.getResources(selectedCourse);
          setResources(res);
      }
  };

  const handleGradeChange = (enrollmentId: string, field: string, value: string) => {
    const numVal = parseFloat(value) || 0;
    setStudents(prev => prev.map(s => {
        if (s.id === enrollmentId) {
            const updated = { ...s, [field]: numVal };
            updated.final_score = (updated.grade_p1 * 0.3) + (updated.grade_p2 * 0.3) + (updated.grade_final * 0.4);
            return updated;
        }
        return s;
    }));
  };

  const saveGrades = async () => {
      setIsSaving(true);
      for (const s of students) {
          await api.updateGrade(s.id, 'grade_p1', s.grade_p1);
          await api.updateGrade(s.id, 'grade_p2', s.grade_p2);
          await api.updateGrade(s.id, 'grade_final', s.grade_final);
      }
      setIsSaving(false);
      setToast({ type: 'success', title: 'Notas Guardadas', message: 'Las calificaciones han sido actualizadas.' });
  };

  const saveAttendance = async () => {
      if(!selectedCourse) return;
      setIsSaving(true);
      const records = students.map(s => ({
          course_id: selectedCourse,
          student_id: s.student_id,
          date: attendanceDate,
          status: attendanceData.find(a => a.student_id === s.student_id)?.status || 'present'
      }));
      await api.saveAttendance(records);
      setIsSaving(false);
      setToast({ type: 'success', title: 'Asistencia Registrada', message: `Asistencia del ${attendanceDate} guardada.` });
  };

  const handleAttendanceToggle = (studentId: string, status: 'present' | 'late' | 'absent') => {
      setAttendanceData(prev => {
          const existing = prev.find(a => a.student_id === studentId);
          if (existing) {
              return prev.map(a => a.student_id === studentId ? { ...a, status } : a);
          } else {
              return [...prev, { id: 'temp', course_id: selectedCourse!, student_id: studentId, date: attendanceDate, status }];
          }
      });
  };

  const confirmExport = (title: string, action: () => void) => {
    setShowExportModal({ isOpen: true, title, action });
  };

  const handleExportAction = () => {
    showExportModal.action();
    setShowExportModal({ ...showExportModal, isOpen: false });
    setToast({ type: 'success', title: 'Descargando...', message: 'Tu archivo se está generando.' });
  };

  const exportCourseGrades = () => {
      if(!selectedCourse || !currentCampus || !currentUser) return;
      const course = courses.find(c => c.id === selectedCourse);
      
      const data = students.map(s => [
          s.student.full_name,
          s.student.meta_data?.carnet || 'N/A',
          s.grade_p1.toString(),
          s.grade_p2.toString(),
          s.grade_final.toString(),
          ((s.grade_p1 * 0.3) + (s.grade_p2 * 0.3) + (s.grade_final * 0.4)).toFixed(1)
      ]);

      generateProfessionalPDF(
          {
              title: 'Reporte de Calificaciones',
              filename: `Notas_${course?.code}.pdf`,
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userName: currentUser.full_name,
              userInfo: [
                  `Asignatura: ${course?.name}`,
                  `Código: ${course?.code}`,
                  `Periodo: Ciclo I 2024`
              ]
          },
          ['Estudiante', 'Carnet', 'Parcial I', 'Parcial II', 'Final', 'Promedio'],
          data
      );
  };

  const exportAttendanceList = () => {
       if(!selectedCourse || !currentCampus || !currentUser) return;
       const course = courses.find(c => c.id === selectedCourse);
       
       const data = students.map(s => {
           const status = attendanceData.find(a => a.student_id === s.student_id)?.status || 'present';
           const statusText = status === 'present' ? 'Presente' : status === 'late' ? 'Tarde' : 'Ausente';
           return [s.student.full_name, s.student.meta_data?.carnet || 'N/A', statusText];
       });

       generateProfessionalPDF(
          {
              title: `Asistencia - ${attendanceDate}`,
              filename: `Asistencia_${attendanceDate}.pdf`,
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userName: currentUser.full_name,
              userInfo: [
                  `Asignatura: ${course?.name}`,
                  `Fecha: ${attendanceDate}`
              ]
          },
          ['Estudiante', 'Carnet', 'Estado'],
          data
       );
  };
  
  const handlePublishResource = async (e: React.FormEvent) => {
      e.preventDefault();
      // If no file uploaded and no URL (unless assignment which might just be instructions title), show error
      if (!newResource.file_data && !newResource.url && newResource.type !== 'assignment') {
          alert("Debe subir un archivo o ingresar una URL.");
          return;
      }
      
      const resourceData = { 
          ...newResource, 
          target_type: newResource.target_type === 'student' ? 'student' : 'all' 
      };

      if (newResource.target_type === 'all') {
          // Loop through all courses
          for (const c of courses) {
              await api.createResource({ ...resourceData, course_id: c.id });
          }
      } else {
          await api.createResource({ ...resourceData, course_id: selectedCourse });
      }

      setShowResourceForm(false);
      loadCourseData();
      setToast({type:'success', title: 'Recurso Publicado', message: 'Los estudiantes ahora pueden verlo.'});
      setNewResource({ title: '', url: '', type: 'pdf', target_type: 'current' });
  };
  
  const handleChangePassword = async () => {
      if (newPassword.length < 4) { alert("La contraseña es muy corta"); return; }
      await api.changePassword(currentUser!.id, newPassword);
      setNewPassword('');
      setToast({ type: 'success', title: 'Seguridad', message: 'Contraseña actualizada.' });
  };

  // --- VIEWS ---

  const OverviewTab = () => {
      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const today = days[new Date().getDay()];
      const todaysClasses = courses.filter(c => c.schedule?.includes(today));

      return (
          <div className="space-y-6 fade-in-up">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg shadow-amber-200">
                  <h2 className="text-3xl font-bold">Panel Docente</h2>
                  <p className="text-amber-100 mt-2">Bienvenido, {currentUser?.full_name}. Tienes <strong className="text-white">{todaysClasses.length} clases</strong> hoy.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18}/> Agenda del Día</h3>
                    {todaysClasses.length === 0 ? <p className="text-gray-400 text-sm">No hay clases programadas.</p> : (
                        <div className="space-y-3">
                            {todaysClasses.map(c => (
                                <div key={c.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.code} • {c.schedule}</p>
                                    </div>
                                    <button onClick={() => setSelectedCourse(c.id)} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">Gestionar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell size={18}/> Avisos Recientes</h3>
                    {notifications.length === 0 ? <p className="text-gray-400 text-sm">No hay avisos nuevos.</p> : (
                         <div className="space-y-3">
                            {notifications.slice(0, 3).map(n => (
                                <div key={n.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm">{n.title}</h4>
                                        <span className="text-[10px] text-blue-500 font-bold">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                                </div>
                            ))}
                         </div>
                    )}
                </div>
              </div>
          </div>
      )
  };

  const NotificationsTab = () => (
      <div className="space-y-6 fade-in-up">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><Bell className="text-amber-500"/> Centro de Avisos</h2>
           <div className="grid gap-4">
              {notifications.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400">No tienes notificaciones.</p>
                  </div>
              ) : (
                  notifications.map(n => (
                      <div key={n.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-900">{n.title}</h3>
                              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-sm">{n.message}</p>
                          <div className="mt-3 text-xs font-bold text-amber-600 uppercase">
                              De: {n.sender_name || 'Administración'}
                          </div>
                      </div>
                  ))
              )}
           </div>
      </div>
  );

  const ProfileTab = () => (
      <div className="space-y-6 fade-in-up pb-10">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
               <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 relative group">
                   {isEditingProfile && (
                       <div className="absolute top-4 right-4 bg-white/80 p-4 rounded-xl shadow-lg w-64 backdrop-blur-md">
                           <p className="text-xs font-bold mb-2">Cambiar Portada</p>
                           <ImageUpload label="" currentImage={profileData.cover_url} onImageChange={(d) => setProfileData({...profileData, cover_url: d})} shape="rect"/>
                       </div>
                   )}
               </div>

               <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-6 gap-6">
                        <div className="relative group mx-auto md:mx-0">
                             <img src={profileData.avatar_url} className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white object-cover" alt="Profile" />
                             {isEditingProfile && (
                                <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white p-2 rounded-lg"><ImageUpload label="" currentImage={profileData.avatar_url} onImageChange={(d) => setProfileData({...profileData, avatar_url: d})} shape="circle"/></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 mb-2 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-gray-900">{profileData.full_name}</h2>
                            <p className="text-gray-500 font-medium">{profileData.meta_data?.specialty || 'Docente Universitario'}</p>
                        </div>
                        <div className="flex justify-center md:justify-end w-full md:w-auto">
                           {!isEditingProfile ? (
                               <button onClick={() => setIsEditingProfile(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all flex items-center gap-2"><Edit2 size={16}/> Editar Perfil</button>
                           ) : (
                               <div className="flex gap-2">
                                   <button onClick={() => setIsEditingProfile(false)} className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-xl font-bold">Cancelar</button>
                                   <button onClick={() => { api.updateUser(currentUser!.id, profileData); setUser(profileData as User); setIsEditingProfile(false); setToast({type: 'success', title: 'Perfil Guardado', message: 'Datos actualizados correctamente.'}); }} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700"><Save size={16}/> Guardar</button>
                               </div>
                           )}
                        </div>
                    </div>
                    
                    {isEditingProfile && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={18}/> Seguridad</h3>
                             <div className="bg-gray-50 p-6 rounded-2xl max-w-md">
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nueva Contraseña</label>
                                 <div className="flex gap-2">
                                     <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-xl" placeholder="••••••••" />
                                     <button onClick={handleChangePassword} className="bg-gray-900 text-white px-4 rounded-xl font-bold text-sm">Actualizar</button>
                                 </div>
                             </div>
                        </div>
                    )}
               </div>
          </div>
      </div>
  );

  if (currentView === 'overview') return <OverviewTab />;
  if (currentView === 'notifications') return <NotificationsTab />;
  if (currentView === 'settings') return <ProfileTab />;

  return (
    <div className="space-y-6 relative">
      {/* GLOBAL TOAST */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-xl font-bold text-gray-800">
            {currentView === 'grades' && 'Libro de Calificaciones'}
            {currentView === 'attendance' && 'Control de Asistencia'}
            {currentView === 'resources' && 'Gestión de Aula Virtual'}
         </h2>
        <select className="bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl shadow-sm outline-none focus:border-blue-500 min-w-[200px]" onChange={(e) => setSelectedCourse(e.target.value)} value={selectedCourse || ''}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] fade-in-up">
         {currentView === 'grades' && (
             <>
             <div className="flex justify-end p-4 border-b border-gray-100">
                 <button onClick={() => confirmExport('Lista de Notas', exportCourseGrades)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm">
                     <Download size={16}/> Exportar Lista
                 </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center w-28">I Parcial (30%)</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center w-28">II Parcial (30%)</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center w-28">Final (40%)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center w-24">Nota Final</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {students.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 flex items-center gap-3">
                                <img src={item.student.avatar_url} className="w-8 h-8 rounded-full" alt=""/>
                                <span className="font-medium text-gray-900">{item.student.full_name}</span>
                            </td>
                            {['grade_p1', 'grade_p2', 'grade_final'].map((field) => (
                                <td key={field} className="px-4 py-4 text-center">
                                    <input type="number" min="0" max="100" value={(item as any)[field]} onChange={(e) => handleGradeChange(item.id, field, e.target.value)}
                                        className="w-16 p-2 bg-gray-50 border border-transparent rounded-lg text-center focus:bg-white focus:border-blue-500 outline-none font-medium transition-all text-gray-900" />
                                </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                                <span className={`font-bold ${(item.final_score || 0) >= 60 ? 'text-blue-600' : 'text-red-500'}`}>{((item.grade_p1 * 0.3) + (item.grade_p2 * 0.3) + (item.grade_final * 0.4)).toFixed(1)}</span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={saveGrades} disabled={isSaving} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70">
                    <Save size={18} /><span>{isSaving ? 'Guardando...' : 'Guardar Notas'}</span>
                </button>
             </div>
             </>
         )}

         {currentView === 'attendance' && (
             <div className="p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                     <h3 className="font-bold text-gray-700">Lista de Asistencia</h3>
                     <div className="flex gap-4 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-xl flex-1 sm:flex-initial">
                            <Calendar size={18} className="text-gray-500" />
                            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-transparent outline-none text-gray-700 font-medium w-full" />
                        </div>
                        <button onClick={() => confirmExport('Reporte Asistencia', exportAttendanceList)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold text-xs bg-gray-50 px-3 rounded-xl">
                             <Download size={14}/> Exportar
                        </button>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {students.map(item => {
                         const status = attendanceData.find(a => a.student_id === item.student_id)?.status || 'present';
                         return (
                             <div key={item.student_id} className="p-4 border border-gray-200 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
                                 <div className="flex items-center space-x-3">
                                     <img src={item.student.avatar_url} className="w-10 h-10 rounded-full" alt="" />
                                     <div>
                                         <p className="font-bold text-gray-900 text-sm">{item.student.full_name}</p>
                                         <p className="text-xs text-gray-500">{item.student.meta_data?.carnet || 'Sin Carnet'}</p>
                                     </div>
                                 </div>
                                 <div className="flex space-x-1">
                                     <button onClick={() => handleAttendanceToggle(item.student_id, 'present')} className={`w-8 h-8 rounded-lg font-bold ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>P</button>
                                     <button onClick={() => handleAttendanceToggle(item.student_id, 'late')} className={`w-8 h-8 rounded-lg font-bold ${status === 'late' ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}>T</button>
                                     <button onClick={() => handleAttendanceToggle(item.student_id, 'absent')} className={`w-8 h-8 rounded-lg font-bold ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>A</button>
                                 </div>
                             </div>
                         )
                     })}
                 </div>
                 <div className="mt-8 flex justify-end">
                    <button onClick={saveAttendance} disabled={isSaving} className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"><Save size={18} /><span>Guardar Asistencia</span></button>
                 </div>
             </div>
         )}

         {currentView === 'resources' && (
             <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h3 className="font-bold text-gray-800">Recursos de Aula</h3>
                         <p className="text-sm text-gray-500">Subir materiales, enlaces y tareas para los estudiantes.</p>
                     </div>
                     <button onClick={() => setShowResourceForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md"><Plus size={16}/> Publicar Nuevo</button>
                 </div>
                 {resources.length === 0 ? <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    <Monitor size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold">Aula Virtual Vacía</p>
                    <p className="text-xs mt-1">Sube el primer recurso para este curso.</p>
                 </div> : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {resources.map(res => (
                             <a key={res.id} href={res.url || '#'} target="_blank" className="p-4 border border-gray-200 rounded-2xl flex items-center gap-4 hover:border-blue-300 hover:bg-blue-50 transition-all group relative overflow-hidden">
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0
                                    ${res.type === 'pdf' ? 'bg-red-500' : res.type === 'assignment' ? 'bg-amber-500' : res.type === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                     {res.type === 'image' ? <ImageIcon size={24}/> : res.type === 'assignment' ? <Briefcase size={24}/> : res.type === 'link' ? <LinkIcon size={24}/> : <FileText size={24}/>}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h4 className="font-bold text-gray-900 group-hover:text-blue-700 truncate">{res.title}</h4>
                                     <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                         {res.type === 'assignment' ? 'Tarea / Entrega' : res.type} • {new Date(res.created_at).toLocaleDateString()}
                                     </p>
                                 </div>
                                 {res.target_type === 'student' && <span className="absolute top-2 right-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] rounded-full uppercase font-bold">Privado</span>}
                             </a>
                         ))}
                     </div>
                 )}
             </div>
         )}
      </div>

      {showResourceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-dark backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Publicar en Aula Virtual</h3>
                <form onSubmit={handlePublishResource} className="space-y-4">
                    
                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título del Material</label>
                        <input required className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-900" placeholder="Ej. Guía de Estudio" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
                    </div>

                    {/* Type Select */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Recurso</label>
                        <select className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-900" value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value as any})}>
                            <option value="pdf">Documento PDF</option>
                            <option value="image">Imagen</option>
                            <option value="assignment">Solicitud de Trabajo / Tarea</option>
                            <option value="video">Video</option>
                            <option value="link">Enlace Web</option>
                        </select>
                    </div>

                    {/* Target Logic */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Destinatarios</label>
                        <select className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-900" value={newResource.target_type} onChange={e => setNewResource({...newResource, target_type: e.target.value as any})}>
                            <option value="current">Este Curso (Todos los estudiantes)</option>
                            <option value="all">Todos mis Cursos (Global)</option>
                            <option value="student">Estudiante Específico</option>
                        </select>
                    </div>

                    {/* If specific student */}
                    {newResource.target_type === 'student' && (
                         <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Seleccionar Alumno</label>
                            <select required className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-900" onChange={e => setNewResource({...newResource, target_student_id: e.target.value})}>
                                <option value="">Buscar estudiante...</option>
                                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.student.full_name}</option>)}
                            </select>
                         </div>
                    )}

                    {/* File Upload (Local) */}
                    {newResource.type !== 'link' && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Archivo Local (Obligatorio si no es enlace)</label>
                            <ImageUpload label="" currentImage={newResource.file_data} onImageChange={d => setNewResource({...newResource, file_data: d})} shape="rect"/>
                        </div>
                    )}

                    {/* URL Input (Optional) */}
                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Enlace / URL (Opcional)</label>
                         <input className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-900" placeholder="https://..." value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 border-t border-gray-100 pt-4">
                        <button type="button" onClick={() => setShowResourceForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Publicar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

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

export default ProfessorDashboard;
