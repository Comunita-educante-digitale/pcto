window.doSearch = window.doSearchMain = async function() {

    const mainQuery = document.getElementById("mainSearch")?.value?.trim();
    const navQuery = document.getElementById("navSearch")?.value?.trim();
    const query = mainQuery || navQuery;

    if (!query) return;

    const response = await fetch("/search", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            query: query
        })

    });

    const data = await response.json();

    if (data.success) {

        window.location.href =
            data.redirect;

    } else {

        alert(
            "Nessuna categoria trovata"
        );

    }
}

// Register click listeners for search buttons (safer than inline onclick)
try {
    const navBtn = document.getElementById('navSearchButton');
    if (navBtn) navBtn.addEventListener('click', window.doSearch);

    const mainBtn = document.getElementById('mainSearchButton');
    if (mainBtn) mainBtn.addEventListener('click', window.doSearch);
} catch (e) {
    console.error('Error attaching search button listeners', e);
}