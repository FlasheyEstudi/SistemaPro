
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { Enrollment, Course, Note, User, ScholarshipType, ScholarshipApplication, Resource, ToastMessage } from '../types';
import { generateProfessionalPDF } from '../utils/pdfGenerator';
import { FileText, Download, Clock, PlusCircle, StickyNote, User as UserIcon, CheckSquare, Square, Edit2, Save, Calendar, Award, Bell, Mail, MapPin, Phone, Shield, ArrowRight, Video, Link as LinkIcon, ChevronLeft, Image as ImageIcon, Briefcase, Lock } from 'lucide-react';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import Toast from '../components/Toast';

interface StudentDashboardProps {
    currentView: string;
    onChangeView: (view: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentView, onChangeView }) => {
  const { currentUser, currentCampus, setUser, enterClassroom, activeClassroomCourseId } = useStore();
  
  // Data State
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: Course, absences?: number, attendance_rate?: number })[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [scholarshipTypes, setScholarshipTypes] = useState<ScholarshipType[]>([]);
  const [myScholarships, setMyScholarships] = useState<ScholarshipApplication[]>([]);
  const [classroomResources, setClassroomResources] = useState<Resource[]>([]);
  
  // Interaction State
  const [selectedCoursesToEnroll, setSelectedCoursesToEnroll] = useState<string[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_task: false });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [selectedScholarship, setSelectedScholarship] = useState('');
  const [scholarshipReason, setScholarshipReason] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Modals & Feedback
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState<{ isOpen: boolean, title: string, action: () => void }>({ isOpen: false, title: '', action: () => {} });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentUser, currentView, activeClassroomCourseId]);

  const fetchData = async () => {
      if (!currentUser) return;
      
      if (currentView === 'overview') {
        const history = await api.getStudentHistory(currentUser.id);
        setEnrollments(history);
        const notifs = await api.getNotifications(currentUser.id);
        setNotifications(notifs.slice(0, 5));
        const myNotes = await api.getNotes(currentUser.id);
        setNotes(myNotes.slice(0, 3));
      } else if (currentView === 'enroll') {
          const allCourses = await api.getCourses(currentUser.campus_id);
          const myEnrollments = await api.getEnrollments(currentUser.id);
          const studentCareer = currentUser.meta_data?.career_id;
          const notEnrolled = allCourses.filter(c => {
             const isEnrolled = myEnrollments.find(e => e.course_id === c.id);
             const matchesCareer = studentCareer ? c.career_id === studentCareer : true;
             return !isEnrolled && matchesCareer;
          });
          setAvailableCourses(notEnrolled);
      } else if (currentView === 'history' || currentView === 'schedule') {
          const history = await api.getStudentHistory(currentUser.id);
          setEnrollments(history);
      } else if (currentView === 'scholarships') {
          const types = await api.getScholarshipTypes();
          const apps = await api.getScholarshipApplications(currentUser.id);
          setScholarshipTypes(types);
          setMyScholarships(apps);
      } else if (currentView === 'notes') {
          const myNotes = await api.getNotes(currentUser.id);
          const notifs = await api.getNotifications(currentUser.id);
          setNotes(myNotes);
          setNotifications(notifs);
      } else if (currentView === 'profile') {
          setProfileData(currentUser);
      } else if (currentView === 'classroom' && activeClassroomCourseId) {
          const res = await api.getResources(activeClassroomCourseId);
          // Filter private resources for this student
          const myResources = res.filter(r => r.target_type !== 'student' || r.target_student_id === currentUser.id);
          setClassroomResources(myResources);
      }
  };

  const getAverage = () => {
      if (enrollments.length === 0) return 0;
      const total = enrollments.reduce((acc, curr) => {
          const final = (curr.grade_p1 * 0.3) + (curr.grade_p2 * 0.3) + (curr.grade_final * 0.4);
          return acc + final;
      }, 0);
      return (total / enrollments.length).toFixed(1);
  };

  const getNextClass = () => {
      const now = new Date();
      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const today = days[now.getDay()];
      const todaysClasses = enrollments.filter(e => e.course?.schedule?.includes(today));
      if (todaysClasses.length > 0) return todaysClasses[0];
      return null;
  };
  const nextClass = getNextClass();

  // --- ACTIONS ---

  const handleEnroll = async () => {
      if(!currentUser) return;
      await api.enrollStudent(currentUser.id, selectedCoursesToEnroll);
      setShowEnrollModal(false);
      
      if(window.confirm('¡Inscripción Exitosa! ¿Deseas descargar tu hoja de matrícula?')) {
         exportEnrollmentSheet(selectedCoursesToEnroll);
      }

      setSelectedCoursesToEnroll([]);
      setToast({ type: 'success', title: 'Inscripción Completa', message: 'Materias registradas.' });
      fetchData();
  };
  
  const exportEnrollmentSheet = async (courseIds: string[]) => {
      if(!currentUser || !currentCampus) return;
      const allCourses = await api.getCourses(currentCampus.id);
      const selected = allCourses.filter(c => courseIds.includes(c.id));
      
      const data = selected.map(c => [
          c.code, c.name, c.schedule || 'N/A', c.period
      ]);

      generateProfessionalPDF(
          {
              title: 'Hoja de Matrícula',
              filename: 'Matricula.pdf',
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userName: currentUser.full_name,
              userInfo: [`Carnet: ${currentUser.meta_data?.carnet}`, `Fecha: ${new Date().toLocaleDateString()}`]
          },
          ['Código', 'Asignatura', 'Horario', 'Periodo'],
          data
      );
  };

  const confirmExport = (title: string, action: () => void) => {
      setShowExportModal({ isOpen: true, title, action });
  };

  const handleExportAction = () => {
      showExportModal.action();
      setShowExportModal({ ...showExportModal, isOpen: false });
      setToast({ type: 'success', title: 'Descargando...', message: 'Tu archivo se está generando.' });
  };

  const exportKardex = () => {
      if(!currentUser || !currentCampus) return;
      const data = enrollments.map(e => [
          e.course?.code || '',
          e.course?.name || '',
          e.grade_p1.toString(),
          e.grade_p2.toString(),
          e.grade_final.toString(),
          ((e.grade_p1 * 0.3) + (e.grade_p2 * 0.3) + (e.grade_final * 0.4)).toFixed(1),
          `${e.attendance_rate || 100}%`
      ]);

      generateProfessionalPDF(
          {
              title: 'Historial Académico (Kardex)',
              filename: 'Kardex_Oficial.pdf',
              logoUrl: currentCampus.logo_url,
              campusName: currentCampus.name,
              userName: currentUser.full_name,
              userInfo: [
                  `Carnet: ${currentUser.meta_data?.carnet}`,
                  `Carrera: ${currentUser.meta_data?.career_name || 'Ingeniería'}`,
                  `Promedio Global: ${getAverage()}%`
              ]
          },
          ['Código', 'Asignatura', 'I Parc', 'II Parc', 'Examen', 'Nota Final', 'Asist'],
          data
      );
  };

  const exportSchedule = () => {
      if(!currentUser || !currentCampus) return;
      const data = enrollments.map(e => [
          e.course?.code || '',
          e.course?.name || '',
          e.course?.schedule || 'Por definir',
          e.course?.period || 'N/A'
      ]);

      generateProfessionalPDF(
        {
            title: 'Horario de Clases',
            filename: 'Horario.pdf',
            logoUrl: currentCampus.logo_url,
            campusName: currentCampus.name,
            userName: currentUser.full_name,
            userInfo: [
                `Carnet: ${currentUser.meta_data?.carnet}`,
                `Carrera: ${currentUser.meta_data?.career_name || 'Ingeniería'}`
            ]
        },
        ['Código', 'Asignatura', 'Día/Hora', 'Periodo'],
        data
      );
  };
  
  const handleChangePassword = async () => {
      if (newPassword.length < 4) { alert("Contraseña muy corta"); return; }
      await api.changePassword(currentUser!.id, newPassword);
      setNewPassword('');
      setToast({ type: 'success', title: 'Seguridad', message: 'Contraseña actualizada.' });
  };

  const handleApplyScholarship = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentUser) return;
      await api.applyForScholarship(currentUser.id, selectedScholarship, scholarshipReason);
      setToast({ type: 'success', title: 'Solicitud Enviada', message: 'Tu solicitud de beca está en revisión.' });
      setScholarshipReason('');
      setSelectedScholarship('');
      fetchData();
  };

  const handleCreateNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentUser) return;
      await api.createNote({ student_id: currentUser.id, ...newNote, is_completed: false });
      setNewNote({ title: '', content: '', is_task: false });
      fetchData();
  };

  // --- VIEWS ---

  const ClassroomView = () => {
      const currentCourse = enrollments.find(e => e.course_id === activeClassroomCourseId)?.course;
      
      return (
          <div className="space-y-6 fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => onChangeView('overview')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><ChevronLeft size={20}/></button>
                  <div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentCourse?.name}</h2>
                      <p className="text-gray-500">Aula Virtual • Recursos y Materiales</p>
                  </div>
              </div>

              {classroomResources.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <FileText size={32}/>
                      </div>
                      <h3 className="font-bold text-gray-400">Sin recursos publicados</h3>
                      <p className="text-xs text-gray-300 mt-1">El profesor aún no ha subido materiales.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classroomResources.map(res => (
                          <div key={res.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex items-start gap-4 group">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0
                                  ${res.type === 'video' ? 'bg-red-500' : res.type === 'link' ? 'bg-blue-500' : res.type === 'image' ? 'bg-purple-500' : 'bg-orange-500'}`}>
                                  {res.type === 'video' ? <Video size={24}/> : res.type === 'link' ? <LinkIcon size={24}/> : res.type === 'image' ? <ImageIcon size={24}/> : <FileText size={24}/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-800 truncate">{res.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">{res.type}</p>
                                  <p className="text-[10px] text-gray-400 mt-2">Publicado el {new Date(res.created_at).toLocaleDateString()}</p>
                                  
                                  <div className="mt-3 flex gap-2">
                                      {/* Logic to handle link vs local file */}
                                      {res.url ? (
                                           <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors inline-block">
                                               Abrir Enlace
                                           </a>
                                      ) : res.file_data ? (
                                           <a href={res.file_data} download={res.title} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-black transition-colors inline-flex items-center gap-1">
                                               <Download size={12}/> Descargar
                                           </a>
                                      ) : null}

                                      {/* Image Preview */}
                                      {res.type === 'image' && res.file_data && (
                                          <button onClick={() => {
                                              const w = window.open("");
                                              w?.document.write(`<img src="${res.file_data}" style="max-width:100%"/>`);
                                          }} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                                              Ver Imagen
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  const OverviewTab = () => (
      <div className="space-y-6 fade-in-up">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Chart */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="relative z-10">
                      <p className="text-gray-500 font-bold text-sm">Promedio Global</p>
                      <h3 className="text-4xl font-bold text-blue-600 mt-2">{getAverage()}%</h3>
                      <p className="text-xs text-gray-400 mt-1">Rendimiento Académico</p>
                  </div>
                  <div className="w-24 h-24 relative transform group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#eff6ff" strokeWidth="8" fill="transparent" />
                          <circle cx="48" cy="48" r="40" stroke="#2563eb" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * Number(getAverage()) / 100)} />
                      </svg>
                  </div>
              </div>

              {/* Next Class */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div>
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                          <Clock size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Ahora / Próxima</span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight z-10 relative">{nextClass ? nextClass.course?.name : "Día Libre"}</h3>
                      {nextClass && <p className="text-sm opacity-80">{nextClass.course?.schedule}</p>}
                  </div>
                  {nextClass ? (
                      <button onClick={() => { enterClassroom(nextClass.course_id); onChangeView('classroom'); }} className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-4 rounded-xl text-xs font-bold transition-all w-fit flex items-center gap-2">
                          Entrar al Aula <ArrowRight size={14}/>
                      </button>
                  ) : <div className="mt-4 h-8"></div>}
              </div>

              {/* Quick Notes Widget */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-800">Bloc de Notas Rápido</h4>
                      <StickyNote size={16} className="text-amber-500"/>
                  </div>
                  <div className="space-y-2 mb-3 max-h-24 overflow-y-auto">
                      {notes.length === 0 ? <p className="text-xs text-gray-400">No hay notas pendientes.</p> : notes.slice(0,3).map(n => (
                          <div key={n.id} className="text-xs border-b border-gray-50 pb-1">
                              <span className="font-bold">{n.title}</span> <span className="text-gray-500">- {n.content.substring(0,20)}...</span>
                          </div>
                      ))}
                  </div>
                  <form onSubmit={handleCreateNote} className="flex gap-2">
                      <input className="flex-1 bg-gray-50 border-none rounded-lg text-xs p-2 text-gray-800" placeholder="Escribir nota..." value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value, content: e.target.value})} required/>
                      <button type="submit" className="bg-gray-900 text-white p-2 rounded-lg"><PlusCircle size={14}/></button>
                  </form>
              </div>
          </div>

          {/* Current Classes */}
          <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mis Clases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map(e => (
                      <div key={e.id} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                           onClick={() => { enterClassroom(e.course_id); onChangeView('classroom'); }}>
                          <div>
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded mb-1 inline-block border border-blue-100">{e.course?.code}</span>
                              <h4 className="font-bold text-gray-800">{e.course?.name}</h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={10}/> {e.course?.schedule}</p>
                          </div>
                          <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{((e.grade_p1 * 0.3) + (e.grade_p2 * 0.3) + (e.grade_final * 0.4)).toFixed(1)}</div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Nota Actual</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const ProfileTab = () => (
    <div className="space-y-6 fade-in-up pb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
             <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative group">
                 {/* Cover Upload */}
                 {isEditingProfile && (
                     <div className="absolute top-4 right-4 bg-white/80 p-4 rounded-xl shadow-lg w-64 backdrop-blur-md">
                         <p className="text-xs font-bold mb-2">Cambiar Portada</p>
                         <ImageUpload label="" currentImage={profileData.cover_url} onImageChange={(d) => setProfileData({...profileData, cover_url: d})} shape="rect"/>
                     </div>
                 )}
                 {profileData.cover_url && <img src={profileData.cover_url} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />}
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
                          <p className="text-gray-500 font-medium">{profileData.meta_data?.career_name || 'Estudiante'}</p>
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
                  
                  {isEditingProfile ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-gray-100 pt-8">
                           <div>
                               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon size={18}/> Datos Personales</h3>
                               <div className="space-y-4">
                                   <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" placeholder="Dirección" value={profileData.meta_data?.address} onChange={e => setProfileData({...profileData, meta_data: {...profileData.meta_data, address: e.target.value}})} />
                                   <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" placeholder="Teléfono" value={profileData.meta_data?.phone} onChange={e => setProfileData({...profileData, meta_data: {...profileData.meta_data, phone: e.target.value}})} />
                                   <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" placeholder="Email Personal" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} />
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={18}/> Seguridad</h3>
                               <div className="bg-gray-50 p-6 rounded-2xl">
                                   <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nueva Contraseña</label>
                                   <div className="flex gap-2">
                                       <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-xl text-gray-900" placeholder="••••••••" />
                                       <button onClick={handleChangePassword} className="bg-gray-900 text-white px-4 rounded-xl font-bold text-sm">Actualizar</button>
                                   </div>
                               </div>
                           </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Carnet</p>
                               <p className="font-bold text-gray-800">{profileData.meta_data?.carnet}</p>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Cédula</p>
                               <p className="font-bold text-gray-800">{profileData.meta_data?.cedula}</p>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correo Institucional</p>
                               <p className="font-bold text-gray-800">{profileData.email}</p>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Teléfono</p>
                               <p className="font-bold text-gray-800">{profileData.meta_data?.phone || 'No registrado'}</p>
                           </div>
                      </div>
                  )}
             </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {currentView === 'overview' && <OverviewTab />}
      {currentView === 'classroom' && <ClassroomView />}
      {currentView === 'profile' && <ProfileTab />}
      
      {currentView === 'enroll' && (
        <div className="fade-in-up bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Inscripción en Línea</h3>
            <p className="text-sm text-gray-500 mb-4">Materias disponibles para tu carrera.</p>
            <div className="space-y-2">
                {availableCourses.length === 0 && <p className="text-gray-400 text-center py-4">No hay materias disponibles para inscribir.</p>}
                {availableCourses.map(course => (
                    <div key={course.id} onClick={() => setSelectedCoursesToEnroll(prev => prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id])}
                        className={`p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${selectedCoursesToEnroll.includes(course.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div>
                            <h4 className="font-bold text-gray-900">{course.name}</h4>
                            <p className="text-xs text-gray-500">{course.schedule} • {course.code}</p>
                        </div>
                        {selectedCoursesToEnroll.includes(course.id) && <CheckSquare className="text-blue-600"/>}
                    </div>
                ))}
            </div>
            {availableCourses.length > 0 && (
                <button 
                  onClick={() => setShowEnrollModal(true)} 
                  disabled={selectedCoursesToEnroll.length === 0} 
                  className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 hover:bg-blue-700 transition-all"
                >
                    Confirmar Inscripción ({selectedCoursesToEnroll.length})
                </button>
            )}
        </div>
      )}

      {currentView === 'schedule' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 fade-in-up">
              <div className="flex justify-between items-center mb-6">
                  <div><h3 className="text-xl font-bold text-gray-900">Horario de Clases</h3><p className="text-sm text-gray-500">Ciclo Actual</p></div>
                  <button onClick={() => confirmExport('Horario de Clases', exportSchedule)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-transform hover:-translate-y-1"><Download size={16}/> Exportar PDF</button>
              </div>
              <div className="grid gap-4">
                  {enrollments.map(e => (
                      <div key={e.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-gray-50">
                          <div>
                              <p className="font-bold text-gray-900">{e.course?.name}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-2"><Clock size={14}/> {e.course?.schedule}</p>
                          </div>
                          <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold">{e.course?.code}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {currentView === 'history' && <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div><h3 className="text-xl font-bold text-gray-900">Historial Académico</h3><p className="text-sm text-gray-500">Kardex de notas y asistencia</p></div>
              <button onClick={() => confirmExport('Kardex de Notas', exportKardex)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-transform hover:-translate-y-1 w-full sm:w-auto justify-center"><Download size={16}/> Exportar PDF</button>
          </div>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                      <tr>
                          <th className="px-4 py-3 rounded-l-xl">Asignatura</th>
                          <th className="px-4 py-3 text-center">I Parcial</th>
                          <th className="px-4 py-3 text-center">II Parcial</th>
                          <th className="px-4 py-3 text-center">Final</th>
                          <th className="px-4 py-3 text-center">Nota</th>
                          <th className="px-4 py-3 text-center rounded-r-xl">Asistencia</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {enrollments.map(e => (
                          <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-4 py-4 font-medium text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{e.course?.name}</td>
                              <td className="px-4 py-4 text-center text-sm font-mono text-gray-600">{e.grade_p1}</td>
                              <td className="px-4 py-4 text-center text-sm font-mono text-gray-600">{e.grade_p2}</td>
                              <td className="px-4 py-4 text-center text-sm font-mono text-gray-600">{e.grade_final}</td>
                              <td className="px-4 py-4 text-center font-bold text-blue-600 text-base">{((e.grade_p1 * 0.3) + (e.grade_p2 * 0.3) + (e.grade_final * 0.4)).toFixed(1)}</td>
                              <td className="px-4 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${(e.attendance_rate || 100) > 85 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.attendance_rate || 100}%</span></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>}
      
      {currentView === 'scholarships' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in-up">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Solicitar Beca</h3>
              <form onSubmit={handleApplyScholarship} className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Beca</label>
                      <select required className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:bg-white transition-colors outline-none focus:border-blue-500 text-gray-900" value={selectedScholarship} onChange={e => setSelectedScholarship(e.target.value)}>
                          <option value="">Seleccione...</option>
                          {scholarshipTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.percentage}% Cobertura)</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
                      <textarea required className="w-full p-3 border border-gray-200 rounded-xl h-32 resize-none bg-white focus:bg-white transition-colors outline-none focus:border-blue-500 text-gray-900" placeholder="Motivo..." value={scholarshipReason} onChange={e => setScholarshipReason(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Enviar Solicitud</button>
              </form>
          </div>
          <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Mis Solicitudes</h3>
              {myScholarships.map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm">
                      <div><p className="font-bold text-gray-800">{app.scholarship_name}</p><p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar size={10}/> {new Date().toLocaleDateString()}</p></div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{app.status}</span>
                  </div>
              ))}
          </div>
      </div>}
      
      {currentView === 'notes' && <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up">
        {/* Notifications Column */}
        <div className="md:col-span-1 space-y-4">
             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                 <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2"><Bell size={16}/> Avisos Recientes</h4>
                 <div className="space-y-2">
                     {notifications.map(n => (
                         <div key={n.id} className="bg-white p-3 rounded-xl shadow-sm border border-blue-50">
                             <p className="text-xs font-bold text-gray-800">{n.title}</p>
                             <p className="text-[10px] text-gray-500 mb-2">{n.message}</p>
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Notes Column */}
        <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleCreateNote} className="bg-white p-4 rounded-2xl border border-gray-200 flex gap-2 shadow-sm">
                <input className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white focus:bg-white outline-none focus:border-blue-300 transition-colors text-gray-900" placeholder="Nueva nota o tarea..." value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value, content: e.target.value})} required/>
                <button type="submit" className="bg-gray-900 text-white px-4 rounded-lg font-bold text-sm hover:bg-black transition-colors">Agregar</button>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notes.map(note => (
                    <div key={note.id} className={`p-4 rounded-2xl border ${note.is_task ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'} shadow-sm relative group hover:shadow-md transition-all`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-bold ${note.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{note.title}</h4>
                            {note.is_task && (
                                <button onClick={() => api.toggleNoteTask(note.id).then(fetchData)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                    {note.is_completed ? <CheckSquare size={20} className="text-green-500"/> : <Square size={20}/>}
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>}

      <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Confirmar Inscripción" type="success"
              footer={
                <>
                  <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button onClick={handleEnroll} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Proceder</button>
                </>
              }
            >
              <p>Estás a punto de inscribir <strong>{selectedCoursesToEnroll.length}</strong> asignaturas para el próximo ciclo. ¿Deseas continuar?</p>
      </Modal>

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

export default StudentDashboard;
