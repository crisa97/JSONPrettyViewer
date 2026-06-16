# JSON Pretty Viewer + Search + Structure

Extensión de Chrome que reemplaza la vista plana de JSON por un visor interactivo a pantalla completa con árbol colapsable, búsqueda, análisis estructural y exportación multi-formato.

## Características

- **Árbol interactivo** con expansión/colapsado por niveles, lazy loading y animación
- **Búsqueda incremental** en el árbol con navegación (◀ ▶) y highlight
- **Búsqueda en lista** con resultados clickeables que llevan al árbol
- **Vista estructura** — esquema de tipos del JSON (colapsable)
- **Breadcrumb** — ruta del nodo seleccionado, cada segmento es clickeable
- **Navegación por teclado** — flechas ↑↓ para mover selección, ←→ para colapsar/expandir, Ctrl+F para buscar
- **Copiar JSON inline** — botón 📋 al hover sobre cualquier nodo
- **Exportación multi-formato** — JSON, Python, JavaScript, TypeScript, PHP, YAML, Ruby
- **Exportación de estructura** — JSON, TypeScript, Python, PHP
- **Tema oscuro/claro** toggle
- **Pantalla completa** (Fullscreen API)
- **Interfaz para pegar JSON** — `viewer.html` con samples y atajo Ctrl+Enter
- **Menú contextual** — copiar ruta o valor

## Uso

1. Abre cualquier URL que devuelva JSON (`Content-Type: application/json`)
2. La extensión reemplaza automáticamente la vista por el visor
3. O haz clic en el icono de la extensión para abrir el editor de pegado

## Archivos

| Archivo | Descripción |
|---|---|
| `manifest.json` | Configuración de la extensión (MV3) |
| `content.js` | Lógica principal: visor, árbol, búsqueda, exportación |
| `styles.css` | Estilos oscuro/claro, animaciones, scrollbar |
| `viewer.html` | Interfaz para pegar JSON manualmente |
| `viewer.js` | Lógica de la interfaz de pegado |
| `background.js` | Service worker (abre `viewer.html` al hacer clic en icono) |
| `icon128.png` | Icono de la extensión |

## Desarrollo

```
git clone <repo>
# Cargar en chrome://extensions como "Carga desempaquetada"
```

## Licencia

MIT
