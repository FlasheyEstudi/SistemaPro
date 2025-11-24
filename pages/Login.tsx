
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { Campus, Role } from '../types';
import { Building, ArrowRight, Shield, GraduationCap, Users, Lock, ChevronLeft, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { setCampus, setUser, currentCampus } = useStore();
  
  // State Machine: 'loading' -> 'campus_select' -> 'role_select' -> 'credentials'
  const [step, setStep] = useState<'loading' | 'campus_select' | 'role_select' | 'credentials'>('loading');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate Initial Load
    setTimeout(() => {
        api.getCampuses().then(data => {
            setCampuses(data);
            setStep('campus_select');
        });
    }, 2000); // 2 seconds preloader
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampus) return;
    
    setLoading(true);
    setError('');
    
    // Simulate slight delay for "Processing" feel
    setTimeout(async () => {
        try {
            // Updated to pass password
            const user = await api.login(currentCampus.id, username, password);
            if (user) {
                if (selectedRole && user.role !== selectedRole) {
                     setError(`Este usuario no tiene permisos de ${selectedRole === 'admin' ? 'Administrador' : selectedRole === 'professor' ? 'Docente' : 'Estudiante'}.`);
                     setLoading(false);
                     return;
                }
                setUser(user);
            } else {
                setError('Usuario o contraseña incorrectos.');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, 800);
  };

  const handleRoleSelect = (role: Role) => {
      setSelectedRole(role);
      // Clean inputs based on demo convenience
      let defaultUser = '';
      if(role === Role.ADMIN) defaultUser = 'admin';
      if(role === Role.PROFESSOR) defaultUser = 'prof';
      if(role === Role.STUDENT) defaultUser = 'student';
      
      setUsername(defaultUser);
      setPassword(defaultUser); 
      setStep('credentials');
  };

  // --- RENDERERS ---

  if (step === 'loading') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
               {/* Background Effects */}
               <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
               <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px] opacity-10"></div>

               <div className="z-10 flex flex-col items-center scale-up">
                   <div className="relative">
                       <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 mb-6">
                           <span className="text-4xl font-bold text-white">U</span>
                       </div>
                       {/* Spinner Ring */}
                       <div className="absolute top-[-10px] left-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] rounded-[30px] border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
                   </div>
                   <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">UniSystem Pro</h1>
                   <p className="text-blue-200 text-sm animate-pulse">Cargando sistema integrado...</p>
               </div>
          </div>
      );
  }

  if (step === 'campus_select') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 slide-up">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-200">
                    <Building size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Seleccionar Recinto</h1>
                <p className="text-gray-500 mt-2">Accede a tu campus universitario</p>
            </div>

            <div className="w-full max-w-md space-y-4">
                {campuses.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => { setCampus(c); setStep('role_select'); }}
                        className="w-full group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg group-hover:scale-110 transition-transform`}>
                                {c.name[0]}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                                <p className="text-xs text-gray-400">Portal Académico</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ArrowRight size={16} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  }

  // --- SPLIT SCREEN LAYOUT FOR ROLES & LOGIN ---
  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
        {/* LEFT SIDE - VISUAL */}
        <div className="hidden lg:flex w-[45%] bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
            {/* Background Abstract */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">U</div>
                    <span className="text-white font-bold tracking-wider opacity-80">UNISYSTEM</span>
                </div>
                <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                    Excelencia <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">Académica</span> <br/>
                    Digital.
                </h2>
                <p className="text-blue-200 max-w-md leading-relaxed">
                    Gestiona tu vida universitaria con nuestra plataforma integral. Accede a notas, horarios y recursos en tiempo real.
                </p>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 text-white/60 text-sm">
                    <span>© 2024 UniSystem</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                    <span>{currentCampus?.name}</span>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE - INTERACTION */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 relative bg-gray-50/50">
            <button 
                onClick={() => {
                    if(step === 'credentials') setStep('role_select');
                    else { setCampus(null); setStep('campus_select'); }
                }}
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm z-20"
            >
                <ArrowLeft size={18}/> {step === 'credentials' ? 'Volver' : 'Campus'}
            </button>

            <div className="w-full max-w-md mt-8 md:mt-0">
                
                {step === 'role_select' && (
                    <div className="slide-in-right">
                        <div className="text-center mb-8 md:mb-10">
                            <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
                            <p className="text-gray-500 mt-2">Selecciona tu perfil para ingresar</p>
                        </div>

                        <div className="grid gap-4">
                            <button onClick={() => handleRoleSelect(Role.ADMIN)} className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl shadow-sm transition-all text-left flex items-center gap-5 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150 group-hover:bg-blue-600/10"></div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                    <Shield size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Administrativo</h3>
                                    <p className="text-xs text-gray-500">Gestión global y configuraciones</p>
                                </div>
                            </button>

                            <button onClick={() => handleRoleSelect(Role.PROFESSOR)} className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-amber-500 hover:shadow-xl shadow-sm transition-all text-left flex items-center gap-5 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-20 h-20 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150 group-hover:bg-amber-500/10"></div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                                    <Users size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Docente</h3>
                                    <p className="text-xs text-gray-500">Aulas, calificaciones y recursos</p>
                                </div>
                            </button>

                            <button onClick={() => handleRoleSelect(Role.STUDENT)} className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-xl shadow-sm transition-all text-left flex items-center gap-5 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150 group-hover:bg-emerald-600/10"></div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                                    <GraduationCap size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Estudiante</h3>
                                    <p className="text-xs text-gray-500">Portal del alumno y servicios</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'credentials' && (
                    <div className="slide-in-right">
                        <div className="text-center mb-8">
                            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg
                                ${selectedRole === Role.ADMIN ? 'bg-blue-600 shadow-blue-200' : 
                                  selectedRole === Role.PROFESSOR ? 'bg-amber-500 shadow-amber-200' : 
                                  'bg-emerald-500 shadow-emerald-200'}`}>
                                {selectedRole === Role.ADMIN && <Shield size={32}/>}
                                {selectedRole === Role.PROFESSOR && <Users size={32}/>}
                                {selectedRole === Role.STUDENT && <GraduationCap size={32}/>}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedRole === Role.ADMIN ? 'Administrativo' : 
                                 selectedRole === Role.PROFESSOR ? 'Docente' : 
                                 'Estudiante'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Usuario</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                        placeholder="Tu usuario"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center animate-pulse">
                                    <span className="mr-2">⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
                                    ${selectedRole === Role.ADMIN ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 
                                      selectedRole === Role.PROFESSOR ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 
                                      'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                            >
                                {loading ? 'Validando...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <a href="#" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">¿Olvidaste tu contraseña?</a>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default Login;
