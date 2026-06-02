window.doSearchMain = async function() {

    const mainQuery = document.getElementById("mainSearch")?.value.trim();
    const navQuery = document.getElementById("navSearch")?.value.trim();
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