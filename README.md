# 🎓 UniSystem Pro - Sistema de Gestión Universitaria (LMS & ERP)

**UniSystem Pro** es una plataforma integral diseñada para la administración de universidades multi-campus. Combina funcionalidades de **ERP** (Planificación de Recursos Empresariales) y **LMS** (Sistema de Gestión de Aprendizaje) en una interfaz moderna, minimalista y responsiva con efectos **Glassmorphism**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Tailwind-blue)
![Node](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)
![DB](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-orange)

---

## ✨ Características Principales

### 🏗️ Arquitectura
*   **Multi-Tenancy (Multi-Campus):** Gestión centralizada de múltiples recintos universitarios con bases de datos aisladas lógicamente.
*   **Roles:** Admin, Profesor y Estudiante con permisos estrictos.
*   **UI/UX Premium:** Diseño moderno con animaciones fluidas, modales de cristal y alertas interactivas.

### 👤 Módulos por Rol

#### 🛡️ Administrador
*   **Gestión Global:** Creación y configuración de Campus (Logo, Precios).
*   **Usuarios:** Registro completo de estudiantes y docentes con generación automática de Fichas en PDF.
*   **Académico:** Gestión de Carreras, Asignaturas y Pensum (Mallas Curriculares).
*   **Matrícula:** Módulo de inscripción masiva o manual.
*   **Becas:** Creación de tipos de beca y aprobación de solicitudes.
*   **Finanzas:** Análisis de presupuesto de becas y estadísticas en tiempo real.
*   **Comunicaciones:** Envío de notificaciones segmentadas (Global, por Rol o Individual).

#### 👨‍🏫 Profesor
*   **Gestión de Aula:** Listas de estudiantes y acceso a perfiles.
*   **Libro de Calificaciones:** Cálculo automático de notas (Parciales + Final).
*   **Asistencia:** Registro diario con reportes exportables.
*   **Recursos (LMS):** Carga de materiales (PDF, Imágenes, Tareas) segmentados por curso o estudiante.

#### 🎓 Estudiante
*   **Portal Académico:** Visualización de notas, asistencia y horario en tiempo real.
*   **Inscripción en Línea:** Selección de asignaturas según carrera.
*   **Aula Virtual:** Descarga de recursos y visualización de tareas.
*   **Trámites:** Solicitud de becas y exportación de documentos (Kardex, Matrícula).

---

## 🚀 Inicio Rápido (Modo Demo)

El proyecto viene configurado por defecto en **Modo Mock**. Esto significa que puedes ejecutar el frontend sin necesidad de configurar la base de datos inmediatamente.

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Iniciar aplicación:**
    ```bash
    npm run dev
    ```

3.  **Credenciales de Prueba (Demo):**
    El sistema precarga usuarios para el "Campus Norte":
    *   **Admin:** `admin` / `admin`
    *   **Profesor:** `prof` / `prof`
    *   **Estudiante:** `student` / `student`

---

## 🛠️ Stack Tecnológico

*   **Frontend:** React 18, Vite, TypeScript.
*   **Estilos:** Tailwind CSS, Framer Motion (CSS puro).
*   **Iconos:** Lucide React.
*   **Estado:** Zustand (Persistencia local).
*   **Reportes:** jsPDF + AutoTable.
*   **Backend:** Node.js, Express.
*   **Base de Datos:** Supabase (PostgreSQL).

---

## 📄 Estructura del Proyecto

```bash
/
├── src/
│   ├── components/   # Componentes reutilizables (Modal, Layout, Toast)
│   ├── pages/        # Vistas principales (Dashboards, Login)
│   ├── services/     # Lógica de conexión (API Mock & Real)
│   ├── store/        # Estado global (Zustand)
│   ├── utils/        # Generador de PDF
│   └── types.ts      # Definiciones TypeScript
├── server/           # Backend Node.js
└── sql/              # Esquema de Base de Datos
```

Para pasar a producción, consulta el archivo `DEPLOYMENT.md`.
