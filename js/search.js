window.campiCount = 1;

window.aggiungiCampo = function() {
    if (window.campiCount >= 3) return;
    window.campiCount++;
    var idx = window.campiCount - 1;
    var wrap = document.getElementById('searchWrap');
    var row = document.createElement('div');
    row.className = 'search-input-row';
    row.id = 'row-' + idx;
    row.innerHTML = '<input class="search-big" type="search" id="search' + idx + '" placeholder="Aggiungi un\'altra preoccupazione..."/>';
    wrap.appendChild(row);
    const newInput = document.getElementById('search' + idx);
    if (window.attachAutocompleteToInput) window.attachAutocompleteToInput(newInput);
    if (window.campiCount >= 3) document.getElementById('addBtn').style.display = 'none';
    newInput.focus();
};

window.doSearch = async function() {
    var queries = [];
    for (var i = 0; i < window.campiCount; i++) {
        var el = document.getElementById('search' + i);
        if (el && el.value.trim()) queries.push(el.value.trim());
    }
    if (queries.length === 0) return;
    var data = await window.searchCategories(queries);
    if (data.success && data.risultati.length > 0) {
        var params = encodeURIComponent(JSON.stringify(data.risultati));
        window.location.href = 'risultati.html?data=' + params;
    } else {
        alert('Nessuna categoria trovata. Prova con parole diverse.');
    }
};

window.doNavSearch = async function() {
    var input = document.getElementById('navSearch');
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;
    var data = await window.searchCategories([query]);
    if (data.success && data.risultati.length > 0) {
        var params = encodeURIComponent(JSON.stringify(data.risultati));
        window.location.href = 'risultati.html?data=' + params;
    } else {
        alert('Nessuna categoria trovata. Prova con parole diverse.');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('mainSearchButton');
    if (btn) btn.addEventListener('click', window.doSearch);
});

(function() {
  var lastY = 0;
  var navbar = document.querySelector('.navbar-custom');
  if (!navbar) return;
  window.addEventListener('scroll', function() {
    var currentY = window.scrollY;
    if (currentY > lastY && currentY > 60) navbar.classList.add('navbar-hidden');
    else navbar.classList.remove('navbar-hidden');
    lastY = currentY;
  });
})();

var searchTrigger = document.getElementById('navSearchButton');
if (searchTrigger) {
    searchTrigger.addEventListener('click', async function() {
        try { await window.doNavSearch(); } catch (error) { console.error('Errore durante la ricerca:', error); }
    });
}

var autocompleteSuggestions = [];

async function caricaKeywords() {
    try { autocompleteSuggestions = await window.getKeywords(); } catch(e) { autocompleteSuggestions = []; }
}
caricaKeywords();

var autocompleteList = null;
var activeInput = null;
var activeIndex = -1;

function createAutocompleteList() {
    if (autocompleteList) return;
    autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';
    document.body.appendChild(autocompleteList);
}

function positionAutocompleteList(input) {
    if (!autocompleteList || !input) return;
    var rect = input.getBoundingClientRect();
    autocompleteList.style.width = rect.width + 'px';
    autocompleteList.style.left = (window.scrollX + rect.left) + 'px';
    autocompleteList.style.top = (window.scrollY + rect.bottom + 6) + 'px';
}

function hideAutocompleteList() { if (autocompleteList) autocompleteList.style.display = 'none'; activeIndex = -1; }
function showAutocompleteList() { if (autocompleteList) autocompleteList.style.display = 'block'; }

function renderAutocompleteMatches(query) {
    if (!autocompleteList) createAutocompleteList();
    autocompleteList.innerHTML = '';
    if (!query || !activeInput) { hideAutocompleteList(); return; }
    var q = query.trim().toLowerCase();
    var matches = autocompleteSuggestions.filter(function(s) { return s.toLowerCase().includes(q); });
    if (matches.length === 0) { hideAutocompleteList(); return; }
    matches.forEach(function(m) {
        var item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = m;
        item.addEventListener('mousedown', function(e) { e.preventDefault(); selectAutocompleteSuggestion(m); });
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
    items.forEach(function(it, idx) { it.classList.toggle('active', idx === activeIndex); });
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
}

function attachAutocompleteToInput(input) {
    if (!input) return;
    input.setAttribute('autocomplete', 'off');
    input.addEventListener('focus', function() { activeInput = input; renderAutocompleteMatches(input.value || ''); });
    input.addEventListener('input', function() { activeInput = input; renderAutocompleteMatches(input.value); });
    input.addEventListener('keydown', function(e) {
        if (!autocompleteList || autocompleteList.style.display === 'none') return;
        var items = Array.from(autocompleteList.querySelectorAll('.autocomplete-item'));
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); updateAutocompleteActive(items); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateAutocompleteActive(items); }
        else if (e.key === 'Enter') { if (activeIndex >= 0 && items[activeIndex]) { e.preventDefault(); selectAutocompleteSuggestion(items[activeIndex].textContent); } }
        else if (e.key === 'Escape') hideAutocompleteList();
    });
}

window.attachAutocompleteToInput = attachAutocompleteToInput;

function setupAutocomplete() {
    createAutocompleteList();
    var navbarInput = document.getElementById('navSearch');
    if (navbarInput) attachAutocompleteToInput(navbarInput);
    document.querySelectorAll('#search0, .search-big').forEach(function(input) { attachAutocompleteToInput(input); });
    document.addEventListener('click', function(e) {
        if (!autocompleteList) return;
        if (e.target === activeInput || autocompleteList.contains(e.target)) return;
        hideAutocompleteList();
    });
    window.addEventListener('resize', function() { if (activeInput) positionAutocompleteList(activeInput); });
    window.addEventListener('scroll', function() { if (activeInput) positionAutocompleteList(activeInput); }, true);
}

document.addEventListener('DOMContentLoaded', setupAutocomplete);
