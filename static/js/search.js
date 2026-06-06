window.campiCount = 1;

window.aggiungiCampo = function() {
    if (window.campiCount >= 3) return;
    window.campiCount++;
    var idx = window.campiCount - 1;
    var wrap = document.getElementById('searchWrap');
    var row = document.createElement('div');
    row.className = 'search-input-row';
    row.id = 'row-' + idx;
    row.innerHTML = '<input class="search-big" type="search" id="search' + idx + '" placeholder="Aggiungi unaltra preoccupazione..."/>';
    wrap.appendChild(row);
    if (window.campiCount >= 3) {
        document.getElementById('addBtn').style.display = 'none';
    }
    document.getElementById('search' + idx).focus();
};

window.doSearch = async function() {
    var queries = [];
    for (var i = 0; i < window.campiCount; i++) {
        var el = document.getElementById('search' + i);
        if (el && el.value.trim()) queries.push(el.value.trim());
    }
    if (queries.length === 0) return;
    var response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: queries })
    });
    var data = await response.json();
    if (data.success) {
        var params = encodeURIComponent(JSON.stringify(data.risultati));
        window.location.href = '/risultati?data=' + params;
    } else {
        alert('Nessuna categoria trovata. Prova con parole diverse.');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('mainSearchButton');
    if (btn) btn.addEventListener('click', window.doSearch);
});

// NAVBAR HIDE ON SCROLL
(function() {
  var lastY = 0;
  var navbar = document.querySelector('.navbar-custom');
  window.addEventListener('scroll', function() {
    var currentY = window.scrollY;
    if (currentY > lastY && currentY > 60) {
      navbar.classList.add('navbar-hidden');
    } else {
      navbar.classList.remove('navbar-hidden');
    }
    lastY = currentY;
  });
})();


const searchTrigger = document.getElementById('navSearchButton');

if (searchTrigger) {
    searchTrigger.addEventListener('click', async () => {
        const queryInput = document.getElementById('navSearch');
        const searchTerm = queryInput ? queryInput.value.trim() : '';
        
        if (!searchTerm) return;

        // chiama direttamente /search senza toccare search0
        try {
            const apiResponse = await fetch('/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queries: [searchTerm] })
            });

            const payload = await apiResponse.json();

            if (payload.success) {
                const encodedData = encodeURIComponent(JSON.stringify(payload.risultati));
                window.location.href = `/risultati?data=${encodedData}`;
            } else {
                alert('Nessuna categoria trovata. Prova con parole diverse.');
            }
        } catch (error) {
            console.error('Errore durante la ricerca:', error);
        }
    });
}

// Autocomplete / suggerimenti dinamici per `#navSearch`
(function() {
    const suggestions = [
        'Dipendenza dagli schermi',
        'Contenuti inappropriati',
        'Privacy e sicurezza online',
        'Isolamento sociale',
        'Social media e cyberbullismo',
        'Videogiochi e gaming',
        'Disinformazione',
        'Impatto cognitivo',
        'Salute fisica',
        'Salute mentale'
    ];

    const input = document.getElementById('navSearch');
    if (!input) return;

    let listEl = null;
    let activeIndex = -1;

    function createList() {
        listEl = document.createElement('div');
        listEl.className = 'autocomplete-list';
        document.body.appendChild(listEl);
    }

    function positionList() {
        if (!listEl) return;
        const rect = input.getBoundingClientRect();
        listEl.style.width = rect.width + 'px';
        listEl.style.left = (window.scrollX + rect.left) + 'px';
        listEl.style.top = (window.scrollY + rect.bottom + 6) + 'px';
    }

    function hideList() {
        if (listEl) listEl.style.display = 'none';
        activeIndex = -1;
    }

    function showList() {
        if (listEl) listEl.style.display = 'block';
    }

    function renderMatches(query) {
        if (!listEl) createList();
        listEl.innerHTML = '';
        if (!query) {
            hideList();
            return;
        }
        const q = query.trim().toLowerCase();
        const matches = suggestions.filter(s => s.toLowerCase().startsWith(q));
        if (matches.length === 0) {
            hideList();
            return;
        }
        matches.forEach((m, i) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = m;
            item.addEventListener('mousedown', function(e) {
                // mousedown so input doesn't lose focus before click
                e.preventDefault();
                selectSuggestion(m);
            });
            listEl.appendChild(item);
        });
        positionList();
        showList();
    }

    function selectSuggestion(text) {
        input.value = text;
        hideList();
        input.focus();
    }

    input.addEventListener('input', function() {
        renderMatches(input.value);
    });

    input.addEventListener('keydown', function(e) {
        if (!listEl || listEl.style.display === 'none') return;
        const items = Array.from(listEl.querySelectorAll('.autocomplete-item'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
            updateActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            updateActive(items);
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                selectSuggestion(items[activeIndex].textContent);
            }
        } else if (e.key === 'Escape') {
            hideList();
        }
    });

  