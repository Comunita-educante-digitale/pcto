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
    const newInput = document.getElementById('search' + idx);
    if (window.attachAutocompleteToInput) {
        window.attachAutocompleteToInput(newInput);
    }
    if (window.campiCount >= 3) {
        document.getElementById('addBtn').style.display = 'none';
    }
    newInput.focus();
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

// Autocomplete / suggerimenti dinamici per le ricerche
let autocompleteSuggestions = [];

async function caricaKeywords() {
    try {
        var res = await fetch('/api/keywords');
        var data = await res.json();
        autocompleteSuggestions = data;
    } catch(e) {
        autocompleteSuggestions = [];
    }
}
caricaKeywords();

let autocompleteList = null;
let activeInput = null;
let activeIndex = -1;

function createAutocompleteList() {
    if (autocompleteList) return;
    autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';
    document.body.appendChild(autocompleteList);
}

function positionAutocompleteList(input) {
    if (!autocompleteList || !input) return;
    const rect = input.getBoundingClientRect();
    autocompleteList.style.width = rect.width + 'px';
    autocompleteList.style.left = (window.scrollX + rect.left) + 'px';
    autocompleteList.style.top = (window.scrollY + rect.bottom + 6) + 'px';
}

function hideAutocompleteList() {
    if (autocompleteList) autocompleteList.style.display = 'none';
    activeIndex = -1;
}

function showAutocompleteList() {
    if (autocompleteList) autocompleteList.style.display = 'block';
}

function renderAutocompleteMatches(query) {
    if (!autocompleteList) createAutocompleteList();
    autocompleteList.innerHTML = '';
    if (!query || !activeInput) {
        hideAutocompleteList();
        return;
    }
    const q = query.trim().toLowerCase();
    const matches = autocompleteSuggestions.filter(s => s.toLowerCase().includes(q));
    if (matches.length === 0) {
        hideAutocompleteList();
        return;
    }
    matches.forEach((m, i) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = m;
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            selectAutocompleteSuggestion(m);
        });
        autocompleteList.appendChild(item);
    });
    positionAutocompleteList(activeInput);
    showAutocompleteList();
}

function selectAutocompleteSuggestion(text) {
    if (!activeInput) return;
    activeInput.value = text;
    hideAutocompleteList();
    activeInput.focus();
}

function updateAutocompleteActive(items) {
    items.forEach((it, idx) => {
        it.classList.toggle('active', idx === activeIndex);
    });
    if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
}

function attachAutocompleteToInput(input) {
    if (!input) return;
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('focus', function() {
        activeInput = input;
        const value = input.value || '';
        renderAutocompleteMatches(value);
    });

    input.addEventListener('input', function() {
        activeInput = input;
        renderAutocompleteMatches(input.value);
    });

    input.addEventListener('keydown', function(e) {
        if (!autocompleteList || autocompleteList.style.display === 'none') return;
        const items = Array.from(autocompleteList.querySelectorAll('.autocomplete-item'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
            updateAutocompleteActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            updateAutocompleteActive(items);
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                selectAutocompleteSuggestion(items[activeIndex].textContent);
            }
        } else if (e.key === 'Escape') {
            hideAutocompleteList();
        }
    });
}

window.attachAutocompleteToInput = attachAutocompleteToInput;

function setupAutocomplete() {
    createAutocompleteList();
    const navbarInput = document.getElementById('navSearch');
    if (navbarInput) attachAutocompleteToInput(navbarInput);
    document.querySelectorAll('#search0, .search-big').forEach(input => {
        attachAutocompleteToInput(input);
    });
    document.addEventListener('click', function(e) {
        if (!autocompleteList) return;
        if (e.target === activeInput || autocompleteList.contains(e.target)) return;
        hideAutocompleteList();
    });
    window.addEventListener('resize', function() {
        if (activeInput) positionAutocompleteList(activeInput);
    });
    window.addEventListener('scroll', function() {
        if (activeInput) positionAutocompleteList(activeInput);
    }, true);
}

document.addEventListener('DOMContentLoaded', setupAutocomplete);
