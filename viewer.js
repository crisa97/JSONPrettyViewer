(function() {
    var pasteScreen = document.getElementById('paste-screen');
    var viewerContainer = document.getElementById('viewer-container');
    var jsonInput = document.getElementById('json-input');
    var formatBtn = document.getElementById('format-btn');
    var errorDiv = document.getElementById('paste-error');
    var backBtn = document.getElementById('back-btn');

    function formatJSON() {
        var text = jsonInput.value.trim();
        if (!text) {
            errorDiv.textContent = '⚠️ Introduce algo de JSON';
            return;
        }
        try {
            var data = JSON.parse(text);
            errorDiv.textContent = '';
            pasteScreen.classList.add('hidden');
            viewerContainer.classList.add('active', 'dark');
            window.renderJSONViewer(data, 'Pasted JSON', document.getElementById('json-viewer-app'));
            var themeBtn = document.getElementById('theme-toggle-btn');
            if (themeBtn) {
                themeBtn.addEventListener('click', function syncTheme() {
                    var app = document.getElementById('json-viewer-app');
                    var vc = document.getElementById('viewer-container');
                    if (app && vc) {
                        vc.classList.remove('dark', 'light');
                        vc.classList.add(app.classList.contains('dark') ? 'dark' : 'light');
                    }
                });
            }
        } catch(e) {
            errorDiv.textContent = '❌ JSON inválido: ' + e.message;
        }
    }

    function resetViewer() {
        var app = document.getElementById('json-viewer-app');
        if (app) app.innerHTML = '';
        viewerContainer.classList.remove('active');
        pasteScreen.classList.remove('hidden');
        jsonInput.focus();
    }

    var clearBtn = document.getElementById('clear-btn');

    function toggleClearBtn() {
        clearBtn.style.display = jsonInput.value.trim() ? 'inline-block' : 'none';
    }

    formatBtn.addEventListener('click', formatJSON);
    backBtn.addEventListener('click', resetViewer);
    clearBtn.addEventListener('click', function() {
        jsonInput.value = '';
        jsonInput.focus();
        errorDiv.textContent = '';
        toggleClearBtn();
    });
    jsonInput.addEventListener('input', toggleClearBtn);
    toggleClearBtn();

    jsonInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            formatJSON();
        }
        if (e.key === 'Escape') {
            jsonInput.blur();
        }
    });

    setTimeout(function() { jsonInput.focus(); }, 100);

    function setSample(obj) {
        jsonInput.value = JSON.stringify(obj, null, 2);
        jsonInput.focus();
    }

    document.getElementById('sample-basic').addEventListener('click', function() {
        setSample({
            name: "Goku",
            age: 42,
            isSaiyan: true,
            powerLevel: 9001,
            abilities: ["Kamehameha", "Instant Transmission", "Super Saiyan"],
            origin: null
        });
    });

    document.getElementById('sample-deep').addEventListener('click', function() {
        setSample({
            project: "JSON Pretty Viewer",
            version: "6.1",
            description: "Browser extension for viewing JSON files",
            features: {
                tree: {
                    enabled: true,
                    maxDepth: 10,
                    colors: ["#ffb86c", "#a6e22e", "#66d9ef", "#e6db74", "#f92672"]
                },
                search: {
                    type: "full-text",
                    caseSensitive: false,
                    highlightColor: "#ffeb3b"
                },
                export: {
                    formats: ["json", "python", "javascript", "typescript", "php", "yaml", "ruby"],
                    structureFormats: ["json", "typescript", "python", "php"]
                }
            },
            contributors: [
                { name: "Alice", role: "Developer", active: true },
                { name: "Bob", role: "Designer", active: true },
                { name: "Charlie", role: "Tester", active: false }
            ]
        });
    });
})();
