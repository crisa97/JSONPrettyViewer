(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', captureAndReplace);
    } else {
        captureAndReplace();
    }

    function captureAndReplace() {
        if (document.contentType === 'text/html') return;
        let jsonText = '';
        const pre = document.querySelector('pre');
        if (pre) {
            jsonText = pre.textContent;
        } else {
            jsonText = document.body ? document.body.textContent : document.documentElement.textContent;
        }
        if (!jsonText.trim()) return;
        let jsonData;
        try {
            jsonData = JSON.parse(jsonText);
        } catch(e) {
            return;
        }
        replaceWithViewer(jsonData, window.location.href);
    }

    function replaceWithViewer(jsonData, url, containerEl) {
        var container;
        if (containerEl) {
            container = containerEl;
            container.innerHTML = '';
        } else {
            document.documentElement.innerHTML = '';
            container = document.createElement('div');
        }
        container.id = 'json-viewer-app';
        container.className = 'dark';
        container.innerHTML = `
            <div class="app-header">
                <div class="app-title">📄 JSON Viewer - ${escapeHtml(url)}</div>
                <div class="app-tabs">
                    <button class="tab-btn active" data-tab="tree">🌳 Árbol</button>
                    <button class="tab-btn" data-tab="search">🔍 Buscar (lista)</button>
                    <button class="tab-btn" data-tab="structure">📐 Estructura (tipos)</button>
                    <button class="tab-btn" data-tab="table">📋 Tabla</button>
                    <button class="tab-btn" data-tab="flatten">📄 Plano</button>
                    <button class="tab-btn" data-tab="diff">🔄 Diff</button>
                    <button class="tab-btn" data-tab="schema">✅ Schema</button>
                </div>
                <div class="app-actions">
                    <div class="tree-search-wrapper">
                        <input type="text" id="tree-search-input" placeholder="🔍 Buscar en el árbol..." title="Búsqueda incremental">
                        <span id="tree-search-counter"></span>
                        <button id="tree-search-prev" disabled>◀</button>
                        <button id="tree-search-next" disabled>▶</button>
                    </div>
                    <input type="text" id="jsonpath-input" placeholder="JSONPath (ej: $.store.book[0].author)" title="Navegar con JSONPath" style="display:none;">
                    <button id="jsonpath-toggle" title="JSONPath">🔎</button>
                    <input type="text" id="key-filter-input" placeholder="Filtrar claves..." title="Filtrar por nombre de clave" style="display:none;">
                    <button id="key-filter-toggle" title="Filtrar claves">🔍</button>
                    <select id="collapse-level-select" title="Colapsar a nivel">
                        <option value="0">Cerrar todo</option>
                        <option value="1">Nivel 1</option>
                        <option value="2">Nivel 2</option>
                        <option value="3">Nivel 3</option>
                        <option value="4">Nivel 4</option>
                        <option value="5">Nivel 5</option>
                        <option value="-1">Abrir todo</option>
                    </select>
                    <button id="theme-toggle-btn" title="Cambiar tema">🌙</button>
                    <button id="collapse-all-btn" title="Cerrar todos">− Cerrar</button>
                    <button id="expand-all-btn" title="Abrir todos">+ Abrir</button>
                    <button id="minify-toggle" title="Minificar/Formatear">📦</button>
                    <select id="download-json-select" title="Descargar datos en formato nativo">
                        <option value="">📥 Datos...</option>
                        <option value="json">JSON</option>
                        <option value="json-min">JSON (min)</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="php">PHP</option>
                        <option value="yaml">YAML</option>
                        <option value="ruby">Ruby</option>
                        <option value="csv">CSV</option>
                    </select>
                    <select id="download-structure-select" title="Descargar estructura en formato nativo">
                        <option value="">📋 Estructura...</option>
                        <option value="json">JSON</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="php">PHP</option>
                    </select>
                    <button id="reload-btn" title="Recargar original">⟳ Original</button>
                </div>
            </div>
            <div class="breadcrumb-bar" id="breadcrumb-bar"></div>
            <div class="app-content">
                <div id="tab-tree" class="tab-content active">
                    <div class="stats-bar">
                        <span>📊 Nodos totales: <span id="node-count">0</span></span>
                        <span>🔑 Campos raíz: <span id="field-count">0</span></span>
                    </div>
                    <div id="tree-container" class="tree-container"></div>
                    <div id="minimap" class="minimap"></div>
                </div>
                <div id="tab-search" class="tab-content">
                    <div class="search-bar">
                        <input type="text" id="search-input" placeholder="Buscar en todo el JSON (resultados en lista)...">
                        <select id="search-type-filter" title="Filtrar por tipo">
                            <option value="">Todos los tipos</option>
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="null">Null</option>
                            <option value="object">Object</option>
                            <option value="array">Array</option>
                        </select>
                        <span id="search-count" class="search-count">0 resultados</span>
                    </div>
                    <div id="search-results" class="search-results"></div>
                </div>
                <div id="tab-structure" class="tab-content">
                    <div class="structure-info">
                        <p>📌 Estructura de tipos del JSON (colapsable, sin valores repetidos). Los arrays muestran la estructura del primer elemento una sola vez.</p>
                    </div>
                    <div id="structure-container" class="structure-container"></div>
                </div>
                <div id="tab-table" class="tab-content">
                    <div class="table-info">
                        <p>📋 Vista tabular para arrays de objetos. Selecciona un array en el árbol para verlo como tabla.</p>
                    </div>
                    <div id="table-container" class="table-container"></div>
                </div>
                <div id="tab-flatten" class="tab-content">
                    <div class="flatten-info">
                        <p>📄 Vista plana: todos los pares clave-valor con su ruta completa.</p>
                    </div>
                    <div id="flatten-container" class="flatten-container"></div>
                </div>
                <div id="tab-diff" class="tab-content">
                    <div class="diff-header">
                        <textarea id="diff-input" placeholder="Pega otro JSON para comparar..."></textarea>
                        <button id="diff-btn">🔄 Comparar</button>
                    </div>
                    <div id="diff-container" class="diff-container"></div>
                </div>
                <div id="tab-schema" class="tab-content">
                    <div class="schema-header">
                        <textarea id="schema-input" placeholder="Pega un JSON Schema para validar..."></textarea>
                        <button id="validate-btn">✅ Validar</button>
                        <span id="validation-result"></span>
                    </div>
                    <div id="schema-container" class="schema-container"></div>
                </div>
            </div>
            <div id="context-menu" class="context-menu"></div>
        `;
        if (!containerEl) {
            document.documentElement.appendChild(container);
        }

        const treeContainer = document.getElementById('tree-container');
        const nodeCountSpan = document.getElementById('node-count');
        const fieldCountSpan = document.getElementById('field-count');
        const searchInputList = document.getElementById('search-input');
        const searchCountSpan = document.getElementById('search-count');
        const searchResultsDiv = document.getElementById('search-results');
        const structureContainer = document.getElementById('structure-container');
        const tableContainer = document.getElementById('table-container');
        const flattenContainer = document.getElementById('flatten-container');
        const diffContainer = document.getElementById('diff-container');
        const diffInput = document.getElementById('diff-input');
        const diffBtn = document.getElementById('diff-btn');
        const schemaContainer = document.getElementById('schema-container');
        const schemaInput = document.getElementById('schema-input');
        const validateBtn = document.getElementById('validate-btn');
        const validationResult = document.getElementById('validation-result');
        const breadcrumbBar = document.getElementById('breadcrumb-bar');
        const minimap = document.getElementById('minimap');
        const jsonpathInput = document.getElementById('jsonpath-input');
        const jsonpathToggle = document.getElementById('jsonpath-toggle');
        const keyFilterInput = document.getElementById('key-filter-input');
        const keyFilterToggle = document.getElementById('key-filter-toggle');
        const minifyToggle = document.getElementById('minify-toggle');
        const searchTypeFilter = document.getElementById('search-type-filter');
        let currentTableArray = null;
        let currentTablePath = '';
        let minimapCanvas = null;
        let minimapCtx = null;
        let isMinified = false;
        let originalJsonData = jsonData;

        // --- Utilidades comunes ---
        function countNodes(data) {
            let count = 1;
            if (data && typeof data === 'object') {
                if (Array.isArray(data)) {
                    for (let item of data) count += countNodes(item);
                } else {
                    for (let key in data) count += countNodes(data[key]);
                }
            }
            return count;
        }

        function getRootFieldCount(data) {
            if (data && typeof data === 'object' && !Array.isArray(data)) return Object.keys(data).length;
            return 0;
        }

        function getTypeOf(value) {
            if (value === null) return 'null';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        }

        function getValueText(data, mode) {
            if (mode === 'type') {
                const t = getTypeOf(data);
                if (t === 'null') return { text: 'null', cls: 'null' };
                if (t === 'string') return { text: 'string', cls: 'string' };
                if (t === 'number') return { text: 'number', cls: 'number' };
                if (t === 'boolean') return { text: 'boolean', cls: 'boolean' };
                if (t === 'array') return { text: 'Array[' + data.length + ']', cls: 'array' };
                if (t === 'object') {
                    const fc = Object.keys(data).length;
                    return { text: 'Object {' + fc + ' field' + (fc !== 1 ? 's' : '') + '}', cls: 'object' };
                }
            }
            if (data === null) return { text: 'null', cls: 'null' };
            if (typeof data === 'string') {
                const isUrl = data.startsWith('http://') || data.startsWith('https://');
                return { text: '"' + data + '"', cls: isUrl ? 'url' : 'string', url: isUrl ? data : null };
            }
            if (typeof data === 'number') return { text: String(data), cls: 'number' };
            if (typeof data === 'boolean') return { text: String(data), cls: 'boolean' };
            if (Array.isArray(data)) return { text: 'Array[' + data.length + ']', cls: 'array' };
            if (typeof data === 'object') {
                const fc = Object.keys(data).length;
                return { text: 'Object {' + fc + ' field' + (fc !== 1 ? 's' : '') + '}', cls: 'object' };
            }
            return { text: String(data), cls: '' };
        }

        // --- Constructor de árbol unificado (mode: 'value' | 'type'), lazy loading ---
        function buildDataTree(data, key, mode, path, depth) {
            if (path === undefined) path = '';
            if (depth === undefined) depth = 0;

            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'tree-node';
            nodeDiv.dataset.path = path;
            nodeDiv.dataset.depth = depth;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'tree-header';
            if (key !== null) headerDiv.dataset.key = String(key);

            const toggleSpan = document.createElement('span');
            toggleSpan.className = 'tree-toggle';

            const isType = mode === 'type';
            const t = isType ? getTypeOf(data) : null;
            const hasChildren = isType ? (t === 'object' || t === 'array') : (data && typeof data === 'object');

            if (hasChildren) {
                toggleSpan.textContent = '▶';
                toggleSpan.style.cursor = 'pointer';
            } else {
                toggleSpan.textContent = ' ';
                toggleSpan.style.opacity = '0';
            }

            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key';
            if (key !== null) keySpan.textContent = key + ': ';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'tree-value';
            const info = getValueText(data, mode);
            valueSpan.textContent = info.text;
            valueSpan.classList.add(info.cls);

            if (info.url) {
                valueSpan.style.cursor = 'pointer';
                valueSpan.style.textDecoration = 'underline';
                valueSpan.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.open(info.url, '_blank');
                });
            }

            headerDiv.appendChild(toggleSpan);
            headerDiv.appendChild(keySpan);
            headerDiv.appendChild(valueSpan);
            nodeDiv.appendChild(headerDiv);

            if (hasChildren) {
                let childrenContainer = null;
                let rendered = false;

                function ensureChildrenRendered() {
                    if (rendered) return;
                    childrenContainer = document.createElement('div');
                    childrenContainer.className = 'tree-children';
                    const childMode = mode;
                    if (isType && Array.isArray(data)) {
                        if (data.length > 0) {
                            childrenContainer.appendChild(buildDataTree(data[0], '0', childMode, path + '[0]', depth + 1));
                        } else {
                            childrenContainer.appendChild(buildDataTree(null, 'empty', childMode, path, depth + 1));
                        }
                    } else if (Array.isArray(data)) {
                        data.forEach(function(item, idx) {
                            childrenContainer.appendChild(buildDataTree(item, idx, childMode, path + '[' + idx + ']', depth + 1));
                        });
                    } else if (typeof data === 'object') {
                        var entries = Object.entries(data);
                        for (var i = 0; i < entries.length; i++) {
                            var k = entries[i][0];
                            var v = entries[i][1];
                            var childPath = path ? path + '.' + k : k;
                            childrenContainer.appendChild(buildDataTree(v, k, childMode, childPath, depth + 1));
                        }
                    }
                    nodeDiv.appendChild(childrenContainer);
                    rendered = true;
                }

                function expandNode() {
                    ensureChildrenRendered();
                    if (childrenContainer) childrenContainer.style.display = 'block';
                    toggleSpan.textContent = '▼';
                    nodeDiv.classList.add('expanded');
                }

                function collapseNode() {
                    if (childrenContainer) childrenContainer.style.display = 'none';
                    toggleSpan.textContent = '▶';
                    nodeDiv.classList.remove('expanded');
                }

                nodeDiv._expand = expandNode;
                nodeDiv._collapse = collapseNode;

                toggleSpan.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (nodeDiv.classList.contains('expanded')) {
                        collapseNode();
                    } else {
                        expandNode();
                    }
                });
            }

            // --- Menú contextual ---
            headerDiv.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e.clientX, e.clientY, path, info.text, data);
            });

            return nodeDiv;
        }

        // --- Context menu ---
        var contextMenu = document.getElementById('context-menu');
        var contextTarget = null;

        function showContextMenu(x, y, path, valueText, data) {
            var items = [
                { label: '📁 Copiar ruta', action: function() { copyToClipboard(path); } },
                { label: '📄 Copiar valor', action: function() {
                    var val = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                    copyToClipboard(val);
                } }
            ];
            contextMenu.innerHTML = '';
            for (var i = 0; i < items.length; i++) {
                var item = document.createElement('div');
                item.className = 'context-menu-item';
                item.textContent = items[i].label;
                item.addEventListener('click', function(action) {
                    return function() {
                        action();
                        hideContextMenu();
                    };
                }(items[i].action));
                contextMenu.appendChild(item);
            }
            contextMenu.style.display = 'block';
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
        }

        function hideContextMenu() {
            if (contextMenu) contextMenu.style.display = 'none';
        }

        function copyToClipboard(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(function() {});
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.documentElement.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch(e) {}
                document.documentElement.removeChild(ta);
            }
        }

        document.addEventListener('click', hideContextMenu);

        // --- Árbol de valores con búsqueda ---
        var currentHighlights = [];
        var currentHighlightIndex = -1;
        var treeSearchMatches = [];

        function clearHighlights() {
            for (var i = 0; i < currentHighlights.length; i++) {
                currentHighlights[i].classList.remove('tree-highlight');
            }
            currentHighlights = [];
        }

        function revealPath(targetPath) {
            if (!targetPath) return null;
            var parts = parsePath(targetPath);
            var current = treeContainer.querySelector('.tree-node');
            if (!current) return null;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                if (!current._expand) return null;
                current._expand();
                var children = current.querySelector(':scope > .tree-children');
                if (!children) return null;
                var found = null;
                for (var j = 0; j < children.children.length; j++) {
                    var child = children.children[j];
                    var header = child.querySelector(':scope > .tree-header');
                    if (header && header.dataset.key === String(part.key)) {
                        found = child;
                        break;
                    }
                }
                if (!found) return null;
                current = found;
            }
            return current;
        }

        function parsePath(pathStr) {
            var parts = [];
            if (!pathStr) return parts;
            var segments = pathStr.split('.');
            for (var i = 0; i < segments.length; i++) {
                var seg = segments[i];
                var bracketIdx = seg.indexOf('[');
                if (bracketIdx === -1) {
                    parts.push({ key: seg });
                } else {
                    var key = seg.substring(0, bracketIdx);
                    var idxStr = seg.substring(bracketIdx + 1, seg.length - 1);
                    if (key) parts.push({ key: key });
                    parts.push({ key: idxStr });
                }
            }
            return parts;
        }

        function searchDataForTerm(data, term) {
            var results = [];
            var lowerTerm = term.toLowerCase();
            function traverse(obj, path) {
                if (obj === null || typeof obj !== 'object') {
                    var str = String(obj);
                    if (str.toLowerCase().indexOf(lowerTerm) !== -1) {
                        results.push({ path: path, value: str, data: obj });
                    }
                    return;
                }
                if (Array.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        traverse(obj[i], path + '[' + i + ']');
                    }
                } else {
                    var keys = Object.keys(obj);
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var val = obj[key];
                        var newPath = path ? path + '.' + key : key;
                        if (key.toLowerCase().indexOf(lowerTerm) !== -1) {
                            var valStr = (val !== null && typeof val === 'object') ? JSON.stringify(val) : String(val);
                            results.push({ path: newPath, value: '(clave) ' + key, data: key, isKey: true });
                        }
                        traverse(val, newPath);
                    }
                }
            }
            traverse(data, '');
            return results;
        }

        function doTreeSearch(term) {
            var counterSpan = document.getElementById('tree-search-counter');
            if (!counterSpan) return;
            clearHighlights();
            if (!term.trim()) {
                counterSpan.innerText = '';
                treeSearchMatches = [];
                currentHighlightIndex = -1;
                updateTreeNavButtons();
                return;
            }
            treeSearchMatches = searchDataForTerm(jsonData, term);
            var count = treeSearchMatches.length;
            counterSpan.innerText = String(count);
            if (count > 0) {
                currentHighlightIndex = 0;
                goToTreeMatch(0);
            } else {
                currentHighlightIndex = -1;
            }
            updateTreeNavButtons();
        }

        function goToTreeMatch(index) {
            if (index < 0 || index >= treeSearchMatches.length) return;
            var match = treeSearchMatches[index];
            var node = revealPath(match.path);
            if (node) {
                clearHighlights();
                var span = match.isKey ? node.querySelector('.tree-key') : node.querySelector('.tree-value');
                if (span) {
                    span.classList.add('tree-highlight');
                    currentHighlights.push(span);
                }
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function updateTreeNavButtons() {
            var prevBtn = document.getElementById('tree-search-prev');
            var nextBtn = document.getElementById('tree-search-next');
            if (!prevBtn || !nextBtn) return;
            var has = treeSearchMatches.length > 0;
            prevBtn.disabled = !has;
            nextBtn.disabled = !has;
        }

        function goPrevHighlight() {
            if (treeSearchMatches.length === 0) return;
            currentHighlightIndex = (currentHighlightIndex - 1 + treeSearchMatches.length) % treeSearchMatches.length;
            goToTreeMatch(currentHighlightIndex);
        }

        function goNextHighlight() {
            if (treeSearchMatches.length === 0) return;
            currentHighlightIndex = (currentHighlightIndex + 1) % treeSearchMatches.length;
            goToTreeMatch(currentHighlightIndex);
        }

        // --- Colapsar / Expandir ---
        function expandAllNodes(node) {
            if (node._expand) {
                node._expand();
                var childContainer = node.querySelector(':scope > .tree-children');
                if (childContainer) {
                    for (var i = 0; i < childContainer.children.length; i++) {
                        expandAllNodes(childContainer.children[i]);
                    }
                }
            }
        }

        function collapseAllNodes(node) {
            var childContainer = node.querySelector(':scope > .tree-children');
            if (childContainer) {
                for (var i = 0; i < childContainer.children.length; i++) {
                    collapseAllNodes(childContainer.children[i]);
                }
            }
            if (node._collapse) {
                node._collapse();
            }
        }

        function collapseToLevel(node, maxDepth) {
            var depth = parseInt(node.dataset.depth, 10);
            if (depth >= maxDepth) {
                if (node._collapse) node._collapse();
            } else {
                if (node._expand) {
                    node._expand();
                    var childContainer = node.querySelector(':scope > .tree-children');
                    if (childContainer) {
                        for (var i = 0; i < childContainer.children.length; i++) {
                            collapseToLevel(childContainer.children[i], maxDepth);
                        }
                    }
                }
            }
        }

        function handleCollapseLevel(value) {
            var root = treeContainer.querySelector('.tree-node');
            if (!root) return;
            if (value === '-1') {
                expandAllNodes(root);
            } else if (value === '0') {
                collapseAllNodes(root);
            } else {
                collapseToLevel(root, parseInt(value, 10));
            }
        }

        // --- Render tree ---
        function renderTree() {
            treeContainer.innerHTML = '';
            var tree = buildDataTree(jsonData, null, 'value', '', 0);
            treeContainer.appendChild(tree);
            nodeCountSpan.textContent = countNodes(jsonData);
            fieldCountSpan.textContent = getRootFieldCount(jsonData);
        }

        // --- Buscador en lista (pestaña Buscar) ---
        function searchInData(data, searchTerm, currentPath) {
            if (currentPath === undefined) currentPath = '';
            var results = [];
            var term = searchTerm.toLowerCase();
            function traverse(obj, path) {
                if (obj === null || typeof obj !== 'object') {
                    var str = String(obj);
                    if (str.toLowerCase().indexOf(term) !== -1) {
                        results.push({ path: path, value: str });
                    }
                    return;
                }
                if (Array.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        traverse(obj[i], path + '[' + i + ']');
                    }
                } else {
                    var keys = Object.keys(obj);
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var val = obj[key];
                        var newPath = path ? path + '.' + key : key;
                        if (key.toLowerCase().indexOf(term) !== -1) {
                            results.push({ path: newPath, value: '(clave) ' + key, isKey: true });
                        }
                        traverse(val, newPath);
                    }
                }
            }
            traverse(data, currentPath);
            return results;
        }

        function renderSearchResults(term) {
            if (!searchResultsDiv) return;
            if (!term.trim()) {
                searchResultsDiv.innerHTML = '<div class="search-placeholder">✏️ Escribe algo para buscar dentro del JSON</div>';
                searchCountSpan.textContent = '0 resultados';
                return;
            }
            var results = searchInData(jsonData, term);
            searchCountSpan.textContent = results.length + ' resultado' + (results.length !== 1 ? 's' : '');
            if (results.length === 0) {
                searchResultsDiv.innerHTML = '<div class="no-results">😞 No se encontraron coincidencias</div>';
                return;
            }
            var html = '';
            for (var i = 0; i < results.length; i++) {
                var res = results[i];
            html += '<div class="search-result-item" data-path="' + escapeHtml(res.path) + '" data-is-key="' + (res.isKey ? 'true' : 'false') + '">' +
                '<div class="result-path">📁 ' + escapeHtml(res.path) + '</div>' +
                '<div class="result-value">📄 ' + escapeHtml(res.value) + '</div>' +
                '<span class="result-goto">🌳 Ir al árbol</span>' +
            '</div>';
            }
            searchResultsDiv.innerHTML = html;

            // Click on result → go to tree
            var items = searchResultsDiv.querySelectorAll('.search-result-item');
            for (var i = 0; i < items.length; i++) {
                (function(item) {
                    item.addEventListener('click', function() {
                        var path = item.dataset.path;
                        var isKey = item.dataset.isKey === 'true';
                        switchToTab('tree');
                        var node = revealPath(path);
                        if (node) {
                            clearHighlights();
                            var span = isKey ? node.querySelector('.tree-key') : node.querySelector('.tree-value');
                            if (span) {
                                span.classList.add('tree-highlight');
                                currentHighlights.push(span);
                            }
                            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });
                })(items[i]);
            }
        }

        // --- Estructura de tipos ---
        function renderStructure() {
            if (!structureContainer) return;
            structureContainer.innerHTML = '';
            var tree = buildDataTree(jsonData, null, 'type', '', 0);
            structureContainer.appendChild(tree);
            var rootType = structureContainer.querySelector('.tree-node');
            if (rootType) expandAllNodes(rootType);
        }

        // --- Descargas multi-formato ---
        function indent(level) { return '    '.repeat(level); }

        function toPython(data, level) {
            if (level === undefined) level = 0;
            if (data === null) return 'None';
            if (typeof data === 'boolean') return data ? 'True' : 'False';
            if (typeof data === 'number') return String(data);
            if (typeof data === 'string') return reprString(data);
            if (Array.isArray(data)) {
                if (data.length === 0) return '[]';
                var items = data.map(function(v) { return indent(level + 1) + toPython(v, level + 1); });
                return '[\n' + items.join(',\n') + '\n' + indent(level) + ']';
            }
            if (typeof data === 'object') {
                var keys = Object.keys(data);
                if (keys.length === 0) return '{}';
                var items = keys.map(function(k) { return indent(level + 1) + reprString(k) + ': ' + toPython(data[k], level + 1); });
                return '{\n' + items.join(',\n') + '\n' + indent(level) + '}';
            }
            return String(data);
        }

        function toJavaScript(data, level) {
            if (level === undefined) level = 0;
            if (data === null) return 'null';
            if (typeof data === 'boolean' || typeof data === 'number') return String(data);
            if (typeof data === 'string') return reprString(data);
            if (Array.isArray(data)) {
                if (data.length === 0) return '[]';
                var items = data.map(function(v) { return indent(level + 1) + toJavaScript(v, level + 1); });
                return '[\n' + items.join(',\n') + '\n' + indent(level) + ']';
            }
            if (typeof data === 'object') {
                var keys = Object.keys(data);
                if (keys.length === 0) return '{}';
                var items = keys.map(function(k) { return indent(level + 1) + reprString(k) + ': ' + toJavaScript(data[k], level + 1); });
                return '{\n' + items.join(',\n') + '\n' + indent(level) + '}';
            }
            return String(data);
        }

        function toTypeScript(data, level) {
            if (level === undefined) level = 0;
            return toJavaScript(data, level);
        }

        function toPHP(data, level) {
            if (level === undefined) level = 0;
            if (data === null) return 'null';
            if (typeof data === 'boolean') return data ? 'true' : 'false';
            if (typeof data === 'number') return String(data);
            if (typeof data === 'string') return reprString(data);
            if (Array.isArray(data)) {
                if (data.length === 0) return '[]';
                var items = data.map(function(v, i) {
                    return indent(level + 1) + toPHP(v, level + 1);
                });
                return '[\n' + items.join(',\n') + '\n' + indent(level) + ']';
            }
            if (typeof data === 'object') {
                var keys = Object.keys(data);
                if (keys.length === 0) return '[]';
                var items = keys.map(function(k) {
                    return indent(level + 1) + reprString(k) + ' => ' + toPHP(data[k], level + 1);
                });
                return '[\n' + items.join(',\n') + '\n' + indent(level) + ']';
            }
            return String(data);
        }

        function toRuby(data, level) {
            if (level === undefined) level = 0;
            if (data === null) return 'nil';
            if (typeof data === 'boolean') return data ? 'true' : 'false';
            if (typeof data === 'number') return String(data);
            if (typeof data === 'string') return reprString(data);
            if (Array.isArray(data)) {
                if (data.length === 0) return '[]';
                var items = data.map(function(v) { return indent(level + 1) + toRuby(v, level + 1); });
                return '[\n' + items.join(',\n') + '\n' + indent(level) + ']';
            }
            if (typeof data === 'object') {
                var keys = Object.keys(data);
                if (keys.length === 0) return '{}';
                var items = keys.map(function(k) { return indent(level + 1) + k + ': ' + toRuby(data[k], level + 1); });
                return '{\n' + items.join(',\n') + '\n' + indent(level) + '}';
            }
            return String(data);
        }

        function toYAML(data, level) {
            if (level === undefined) level = 0;
            if (data === null) return 'null';
            if (typeof data === 'boolean') return data ? 'true' : 'false';
            if (typeof data === 'number') return String(data);
            if (typeof data === 'string') {
                var needsQuotes = data === '' || data.indexOf(': ') !== -1 || data.indexOf('#') !== -1 || data.indexOf('\n') !== -1 || data === 'true' || data === 'false' || data === 'null' || data === '~';
                if (needsQuotes) return reprString(data);
                return data;
            }
            if (Array.isArray(data)) {
                if (data.length === 0) return '[]';
                var items = data.map(function(v) {
                    var val = toYAML(v, level + 1);
                    if (v !== null && typeof v === 'object') {
                        return indent(level) + '- ' + val.trim().replace(/\n/g, '\n' + indent(level) + '  ');
                    }
                    return indent(level) + '- ' + val;
                });
                return '\n' + items.join('\n');
            }
            if (typeof data === 'object') {
                var keys = Object.keys(data);
                if (keys.length === 0) return '{}';
                var items = keys.map(function(k) {
                    var val = toYAML(data[k], level + 1);
                    if (data[k] !== null && typeof data[k] === 'object' && !Array.isArray(data[k])) {
                        return indent(level) + k + ':\n' + (level === 0 ? val.replace(/\n/g, '\n') : val.replace(/\n/g, '\n' + indent(level)));
                    }
                    return indent(level) + k + ': ' + val;
                });
                return items.join('\n');
            }
            return String(data);
        }

        function yamlHeader() { return '# YAML generated by JSON Viewer\n'; }

        function reprString(s) {
            var singleQuotes = s.indexOf("'") === -1;
            var doubleQuotes = s.indexOf('"') === -1;
            if (singleQuotes) return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
            return JSON.stringify(s);
        }

        var formatMap = {
            json: { ext: '.json', gen: function(d) { return JSON.stringify(d, null, 2); }, comment: '' },
            python: { ext: '.py', gen: function(d) { return toPython(d, 0); }, comment: '# Python dict generated by JSON Viewer\n' },
            javascript: { ext: '.js', gen: function(d) { return 'const data = ' + toJavaScript(d, 0) + ';\n\nexport default data;\n'; }, comment: '// JavaScript generated by JSON Viewer\n' },
            typescript: { ext: '.ts', gen: function(d) { return 'const data = ' + toTypeScript(d, 0) + ';\n\nexport default data;\n'; }, comment: '// TypeScript generated by JSON Viewer\n' },
            php: { ext: '.php', gen: function(d) { return '<?php\n\n$data = ' + toPHP(d, 0) + ';\n'; }, comment: '// PHP generated by JSON Viewer\n' },
            yaml: { ext: '.yaml', gen: function(d) { return yamlHeader() + toYAML(d, 0); }, comment: '' },
            ruby: { ext: '.rb', gen: function(d) { return 'data = ' + toRuby(d, 0) + '\n'; }, comment: '# Ruby generated by JSON Viewer\n' }
        };

        function extractSchema(data) {
            var t = getTypeOf(data);
            if (t === 'null') return null;
            if (t === 'string') return 'string';
            if (t === 'number') return 'number';
            if (t === 'boolean') return 'boolean';
            if (t === 'array') {
                if (data.length === 0) return [];
                return [extractSchema(data[0])];
            }
            if (t === 'object') {
                var obj = {};
                var keys = Object.keys(data);
                for (var i = 0; i < keys.length; i++) {
                    obj[keys[i]] = extractSchema(data[keys[i]]);
                }
                return obj;
            }
            return t;
        }

        function toPythonTypedDict(data, name) {
            if (name === undefined) name = 'Root';
            var t = extractSchema(data);
            var lines = [];
            lines.push('from typing import TypedDict, List, Optional');
            lines.push('');
            function typeToPy(v, childName) {
                if (v === null) return 'None';
                if (typeof v === 'string') {
                    var typeMap = { 'string': 'str', 'number': 'float', 'boolean': 'bool' };
                    return typeMap[v] || 'str';
                }
                if (Array.isArray(v)) {
                    var inner = v.length > 0 ? typeToPy(v[0], childName + 'Item') : 'Any';
                    return 'List[' + inner + ']';
                }
                if (typeof v === 'object') {
                    gen(childName, v, 0);
                    return childName;
                }
                return 'Any';
            }
            function gen(name, schema, level) {
                var fields = [];
                var keys = Object.keys(schema);
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    var v = schema[k];
                    var childName = name + '_' + k.charAt(0).toUpperCase() + k.slice(1);
                    fields.push(indent(1) + reprString(k) + ': ' + typeToPy(v, childName));
                }
                lines.push('class ' + name + '(TypedDict):');
                if (fields.length === 0) {
                    lines.push(indent(1) + 'pass');
                } else {
                    for (var j = 0; j < fields.length; j++) {
                        lines.push(fields[j]);
                    }
                }
                lines.push('');
            }
            gen(name, t, 0);
            return lines.join('\n');
        }

        function toTypeScriptInterface(data, name) {
            if (name === undefined) name = 'Root';
            var t = extractSchema(data);
            var lines = [];
            function gen(nameVal, schema, level) {
                lines.push('interface ' + nameVal + ' {');
                var keys = Object.keys(schema);
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    var v = schema[k];
                    var tsType = schemaToTypeScript(v, nameVal + '_' + k.charAt(0).toUpperCase() + k.slice(1));
                    lines.push(indent(1) + k + ': ' + tsType + ';');
                }
                lines.push('}');
                lines.push('');
            }
            function schemaToTypeScript(v, childName) {
                if (v === null) return 'null';
                if (typeof v === 'string') {
                    var map = { 'string': 'string', 'number': 'number', 'boolean': 'boolean' };
                    return map[v] || 'string';
                }
                if (Array.isArray(v)) {
                    var inner = v.length > 0 ? schemaToTypeScript(v[0], childName + 'Item') : 'unknown';
                    return inner + '[]';
                }
                if (typeof v === 'object') {
                    gen(childName, v, 0);
                    return childName;
                }
                return 'unknown';
            }
            gen(name, t, 0);
            return lines.join('\n');
        }

        function toPHPArrayDoc(data) {
            var schema = extractSchema(data);
            function gen(v, indentLevel) {
                if (v === null) return 'null';
                if (typeof v === 'string') {
                    var map = { 'string': 'string', 'number': 'int|float', 'boolean': 'bool' };
                    return map[v] || 'string';
                }
                if (Array.isArray(v)) return 'array<' + (v.length > 0 ? gen(v[0], indentLevel) : 'mixed') + '>';
                if (typeof v === 'object') {
                    var keys = Object.keys(v);
                    var items = keys.map(function(k) {
                        return indent(indentLevel + 2) + reprString(k) + ' => ' + gen(v[k], indentLevel + 1);
                    });
                    return 'array{\n' + items.join(',\n') + '\n' + indent(indentLevel + 1) + '}';
                }
                return 'mixed';
            }
            return '<?php\n\n/**\n * @return ' + gen(schema, 0) + '\n */\nfunction getData(): array {}\n';
        }

        var structFormatMap = {
            json: { ext: '.json', gen: function(d) { return JSON.stringify(extractSchema(d), null, 2); } },
            typescript: { ext: '.ts', gen: function(d) { return toTypeScriptInterface(d, 'Root'); } },
            python: { ext: '.py', gen: function(d) { return toPythonTypedDict(d, 'Root'); } },
            php: { ext: '.php', gen: function(d) { return toPHPArrayDoc(d); } }
        };

        function downloadData(format) {
            if (!format || !formatMap[format]) return;
            var info = formatMap[format];
            var content = info.comment + info.gen(jsonData);
            var mime = format === 'json' ? 'application/json' : 'text/plain';
            var blob = new Blob([content], {type: mime});
            var urlBlob = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = urlBlob;
            a.download = 'data' + info.ext;
            a.click();
            URL.revokeObjectURL(urlBlob);
        }

        function downloadStruct(format) {
            if (!format || !structFormatMap[format]) return;
            var info = structFormatMap[format];
            var content = info.gen(jsonData);
            var mime = format === 'json' ? 'application/json' : 'text/plain';
            var blob = new Blob([content], {type: mime});
            var urlBlob = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = urlBlob;
            a.download = 'structure' + info.ext;
            a.click();
            URL.revokeObjectURL(urlBlob);
        }

        // --- Tabs ---
        function switchToTab(tabId) {
            var tabBtns = document.querySelectorAll('.tab-btn');
            var tabContents = document.querySelectorAll('.tab-content');
            for (var i = 0; i < tabBtns.length; i++) {
                tabBtns[i].classList.remove('active');
                if (tabBtns[i].getAttribute('data-tab') === tabId) {
                    tabBtns[i].classList.add('active');
                }
            }
            for (var i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }
            var activeTab = document.getElementById('tab-' + tabId);
            if (activeTab) activeTab.classList.add('active');
            if (tabId === 'structure') renderStructure();
            if (tabId === 'search' && searchInputList && searchInputList.value.trim()) {
                renderSearchResults(searchInputList.value);
            }
        }

        // --- Theme toggle ---
        function toggleTheme() {
            var app = document.getElementById('json-viewer-app');
            var btn = document.getElementById('theme-toggle-btn');
            if (app.classList.contains('dark')) {
                app.classList.remove('dark');
                app.classList.add('light');
                if (btn) btn.textContent = '☀️';
            } else {
                app.classList.remove('light');
                app.classList.add('dark');
                if (btn) btn.textContent = '🌙';
            }
        }

        // --- Keyboard shortcuts ---
        function handleKeydown(e) {
            var treeInput = document.getElementById('tree-search-input');
            var searchInput = document.getElementById('search-input');
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (treeInput) {
                    treeInput.focus();
                    treeInput.select();
                }
                return;
            }
            if (e.key === 'Escape') {
                hideContextMenu();
                if (treeInput && document.activeElement === treeInput) {
                    treeInput.blur();
                }
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.blur();
                }
                return;
            }
            if (treeInput && document.activeElement === treeInput) {
                if (e.key === 'Enter' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    goNextHighlight();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    goPrevHighlight();
                }
            }
        }

        // --- Eventos ---
        // Tree search
        var treeSearchInput = document.getElementById('tree-search-input');
        var prevBtn = document.getElementById('tree-search-prev');
        var nextBtn = document.getElementById('tree-search-next');
        if (treeSearchInput) treeSearchInput.addEventListener('input', function(e) { doTreeSearch(e.target.value); });
        if (prevBtn) prevBtn.addEventListener('click', goPrevHighlight);
        if (nextBtn) nextBtn.addEventListener('click', goNextHighlight);

        // Level selector
        var levelSelect = document.getElementById('collapse-level-select');
        if (levelSelect) levelSelect.addEventListener('change', function(e) { handleCollapseLevel(e.target.value); });

        // Buttons
        var collapseBtn = document.getElementById('collapse-all-btn');
        var expandBtn = document.getElementById('expand-all-btn');
        var reloadBtn = document.getElementById('reload-btn');
        var downloadJsonSelect = document.getElementById('download-json-select');
        var downloadStructSelect = document.getElementById('download-structure-select');
        var themeToggleBtn = document.getElementById('theme-toggle-btn');

        if (collapseBtn) collapseBtn.addEventListener('click', function() {
            var root = treeContainer.querySelector('.tree-node');
            if (root) collapseAllNodes(root);
        });
        if (expandBtn) expandBtn.addEventListener('click', function() {
            var root = treeContainer.querySelector('.tree-node');
            if (root) expandAllNodes(root);
        });
        if (reloadBtn) reloadBtn.addEventListener('click', function() { window.location.reload(); });
        if (downloadJsonSelect) downloadJsonSelect.addEventListener('change', function(e) {
            downloadData(e.target.value);
            e.target.selectedIndex = 0;
        });
        if (downloadStructSelect) downloadStructSelect.addEventListener('change', function(e) {
            downloadStruct(e.target.value);
            e.target.selectedIndex = 0;
        });
        if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

        // New buttons
        if (minifyToggle) minifyToggle.addEventListener('click', toggleMinify);
        if (jsonpathToggle) jsonpathToggle.addEventListener('click', function() { jsonpathInput.style.display = jsonpathInput.style.display === 'none' ? 'block' : 'none'; jsonpathInput.focus(); });
        if (jsonpathInput) jsonpathInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') navigateJsonPath(jsonpathInput.value); });
        if (keyFilterToggle) keyFilterToggle.addEventListener('click', function() { keyFilterInput.style.display = keyFilterInput.style.display === 'none' ? 'block' : 'none'; keyFilterInput.focus(); });
        if (keyFilterInput) keyFilterInput.addEventListener('input', function(e) { applyKeyFilter(e.target.value); });

        // Diff & Schema
        if (diffBtn) diffBtn.addEventListener('click', runDiff);
        if (validateBtn) validateBtn.addEventListener('click', runSchemaValidation);

        // Download CSV
        if (downloadJsonSelect) downloadJsonSelect.addEventListener('change', function(e) {
            downloadData(e.target.value);
            e.target.selectedIndex = 0;
        });
        if (downloadStructSelect) downloadStructSelect.addEventListener('change', function(e) {
            downloadStruct(e.target.value);
            e.target.selectedIndex = 0;
        });
        if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

        // Tab switching
        var tabBtns = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < tabBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    switchToTab(btn.getAttribute('data-tab'));
                });
            })(tabBtns[i]);
        }

        // List search
        if (searchInputList) {
            searchInputList.addEventListener('input', function(e) { renderSearchResults(e.target.value); });
        }
        if (searchTypeFilter) searchTypeFilter.addEventListener('change', function(e) { renderSearchResults(searchInputList.value); });

        // Keyboard
        document.addEventListener('keydown', handleKeydown);

        // --- Init ---
        renderTree();
        renderStructure();
        renderSearchResults('');
        renderFlatten();
        // Expand all nodes by default
        var rootNode = treeContainer.querySelector('.tree-node');
        if (rootNode) expandAllNodes(rootNode);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            if (m === "'") return '&#039;';
            return m;
        });
    }

    // Expose for viewer.html (pasted JSON)
    window.renderJSONViewer = function(data, url, containerEl) {
        replaceWithViewer(data, url || 'Pasted JSON', containerEl);
    };
})();
