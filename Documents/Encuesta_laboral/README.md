# Encuesta de Clima Laboral 2026 - Grupo Aurica

Aplicación Web Single Page (SPA) moderna, minimalista y responsiva diseñada con un enfoque crítico en la **psicología de la privacidad y el anonimato**. Desarrollada con **React (Vite)**, **Tailwind CSS**, **Framer Motion** y arquitectura de backend desacoplada para **Supabase**, optimizada para desplegarse en **Cloudflare Pages**.

---

## 🛡️ Arquitectura de Privacidad (El "Túnel de Desconexión")

Para maximizar la tasa de respuesta y la sinceridad de los colaboradores, el flujo divide estrictamente la identidad del contenido:

1. **Pantalla de Validación (Modo Corporativo)**:
   - Fondo claro corporativo con branding de *Grupo Aurica*.
   - Validación del DNI (8 dígitos) y aceptación explícita de la política de transparencia.
   - El DNI solo actúa como llave de entrada para verificar que pertenece a la planilla.

2. **El "Túnel" de Desconexión (Carga y Transición Criptográfica)**:
   - Transición visual suave hacia el **Modo Oscuro** (estilo Linear / Vercel).
   - Animación de spinner minimalista con cambios temporizados:
     - `0s - 1s`: *"Verificando planilla..."*
     - `1s - 2s`: *"Acceso concedido. Registrando asistencia..."*
     - `2s - 3s`: *"Desconectando identidad de la sesión segura..."*
   - Purga del DNI y asignación de un identificador efímero: `Usuario Anónimo #XXXX`.

3. **Pantalla de Encuesta (Modo Anónimo/Seguro)**:
   - Interfaz en modo oscuro profundo enfocado en la concentración.
   - **Cero logos de la empresa** para eliminar sesgo de vigilancia corporativa.
   - Banner de privacidad verde/neutro indicando el ID anónimo.
   - 3 preguntas con botones táctiles grandes (escala 1 al 5):
     1. *Satisfacción con el liderazgo*
     2. *Herramientas de trabajo*
     3. *Ambiente de equipo*
   - Textarea opcional: *Sugerencias de mejora (Evita incluir nombres propios)*.

4. **Pantalla de Confirmación**:
   - Recibo criptográfico de desconexión permanente y confeti sutil.

---

## 🗄️ Conexión con Supabase

El sistema realiza **dos llamadas HTTP completamente independientes y desacopladas** al enviar la encuesta:

### Llamada 1 (Control de Asistencia - Con DNI, Sin Respuestas):
```javascript
await supabase
  .from('control_dni')
  .update({ voto: true, fecha_participacion: new Date().toISOString() })
  .eq('dni', dni_ingresado);
```

### Llamada 2 (Respuestas - 100% Anónimas, Sin DNI ni Vínculo):
```javascript
await supabase
  .from('respuestas_clima')
  .insert([{
    preg_1: Number(preg_1),
    preg_2: Number(preg_2),
    preg_3: Number(preg_3),
    comentarios: comentarios ? comentarios.trim() : null,
    fecha_envio: new Date().toISOString()
  }]);
```

> **Garantía Estructural**: En la base de datos, la tabla `respuestas_clima` no posee ninguna clave foránea ni relación con `control_dni`.

---

## 🚀 Puesta en Marcha Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Configurar Base de Datos en Supabase

1. Crea un proyecto en [Supabase](https://app.supabase.com).
2. Ve al **SQL Editor** y ejecuta el script [supabase_schema.sql](file:///c:/Users/Leonar/Documents/Encuesta_laboral/supabase_schema.sql).
3. Copia las credenciales en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
*(Nota: Si no se configuran las variables en `.env`, la aplicación funciona automáticamente en **Modo Simulado** para pruebas locales).*

---

## ☁️ Despliegue en Cloudflare Pages

1. Sube este repositorio a GitHub / GitLab.
2. En Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages**.
3. Conecta el repositorio con los siguientes parámetros:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Agrega las variables de entorno en Cloudflare Pages (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
5. El archivo [public/_redirects](file:///c:/Users/Leonar/Documents/Encuesta_laboral/public/_redirects) ya está incluido para el enrutamiento SPA automático.
