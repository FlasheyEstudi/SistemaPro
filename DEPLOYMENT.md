# 🌍 Guía de Despliegue - UniSystem Pro

Esta guía detalla los pasos para conectar la aplicación a una base de datos real (**Supabase**) y desplegar tanto el backend como el frontend.

---

## 1. Configuración de Base de Datos (Supabase)

1.  Crea una cuenta y un nuevo proyecto en [Supabase](https://supabase.com/).
2.  Ve al apartado **SQL Editor** en el panel de Supabase.
3.  Copia el contenido del archivo `sql/schema.sql` de este proyecto.
4.  Pega y ejecuta el script en el editor SQL. Esto creará todas las tablas y relaciones necesarias.
5.  Ve a **Project Settings -> API**. Copia la `Project URL` y la `service_role key` (necesaria para el backend).

---

## 2. Configuración del Backend (Node.js)

El backend actúa como intermediario seguro entre el frontend y Supabase.

1.  Navega a la carpeta del servidor (si está integrado en la raíz, usa la raíz).
2.  Crea un archivo `.env` en la raíz (donde está `server/index.js` o `package.json` principal) con las siguientes variables:

    ```env
    PORT=3000
    SUPABASE_URL=TU_URL_DE_SUPABASE
    SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SERVICE_ROLE
    ```

3.  **Para Despliegue (Ej. Railway / Render):**
    *   Sube el repositorio a GitHub.
    *   Crea un nuevo servicio web en tu proveedor (ej. Render).
    *   Comando de inicio: `node server/index.js`.
    *   Asegúrate de agregar las variables de entorno en el panel de configuración del hosting.

---

## 3. Configuración del Frontend (React)

Debemos decirle a React que deje de usar datos falsos y se conecte a tu backend desplegado.

1.  Abre el archivo `src/services/api.ts`.
2.  Cambia la configuración al inicio del archivo:

    ```typescript
    // src/services/api.ts
    
    // 1. Desactiva el modo Mock
    const USE_MOCK = false; 
    
    // 2. Apunta a la URL de tu backend desplegado (NO localhost)
    const API_URL = 'https://tu-backend-desplegado.com/api'; 
    ```

3.  **Para Despliegue (Ej. Vercel / Netlify):**
    *   Conecta tu repositorio de GitHub a Vercel/Netlify.
    *   El comando de construcción es `npm run build`.
    *   El directorio de salida es `dist`.

---

## 4. Verificación Post-Despliegue

1.  Accede a tu URL del frontend desplegado.
2.  Deberás crear el **Primer Campus** manualmente o mediante API, ya que la base de datos estará vacía.
    *   *Opción SQL:* Ejecuta esto en Supabase para crear el primer campus y admin:
    
    ```sql
    INSERT INTO campuses (name, theme_color, monthly_tuition) VALUES ('Campus Principal', 'blue', 0);
    -- Luego inserta un usuario admin vinculado a ese campus_id
    ```

3.  Intenta iniciar sesión. Si configuraste todo bien, el sistema validará credenciales contra Supabase.

---

## 🚨 Solución de Problemas Comunes

*   **Error de CORS:** Asegúrate de que tu backend tenga configurado `cors` correctamente (ya incluido en `server/index.js`, pero verifica si necesitas restringir orígenes).
*   **Tablas no encontradas:** Verifica que ejecutaste todo el `schema.sql` sin errores.
*   **Imágenes rotas:** El sistema usa URLs para avatares. En producción, considera integrar un bucket de almacenamiento (Supabase Storage) si deseas subir imágenes reales, o usa URLs públicas.
