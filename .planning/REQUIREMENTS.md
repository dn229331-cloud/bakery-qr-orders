# Requirements

## Functional Requirements
1. El formulario debe tener campos de username y password.
2. Al enviar, se valida que ambos campos no estén vacíos.
3. Si las credenciales son admin/123456, se muestra una pantalla de éxito.
4. Si las credenciales son incorrectas, se muestra un mensaje de error.
5. Los errores deben ser visuales y accesibles.

## Non-Functional Requirements
1. Diseño responsive (mobile-first).
2. Sin dependencias externas.
3. Código limpio y mantenible.
4. Archivos separados: index.html, styles.css, app.js.

## Acceptance Criteria
- [ ] index.html carga correctamente
- [ ] CSS aplica estilos responsive
- [ ] JavaScript valida el formulario
- [ ] Login con admin/123456 redirige/muestra éxito
- [ ] Login con credenciales incorrectas muestra error
