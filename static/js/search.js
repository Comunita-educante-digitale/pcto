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


var navBtn = document.getElementById('navSearchButton');
if (navBtn) navBtn.addEventListener('click', async function() {
    var val = document.getElementById('navSearch').value.trim();
    if (!val) return;

    // chiama direttamente /search senza toccare search0
    var response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: [val] })
    });
    var data = await response.json();
    if (data.success) {
        var params = encodeURIComponent(JSON.stringify(data.risultati));
        window.location.href = '/risultati?data=' + params;
    } else {
        alert('Nessuna categoria trovata. Prova con parole diverse.');
    }
});