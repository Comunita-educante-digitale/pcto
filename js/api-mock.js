// Mock layer mantenuto per compatibilità - le funzioni reali sono in app.js
window.appData = null;

async function fetchAppData() {
  const result = await window.getAppData();
  window.appData = result.data;
  return result;
}

window.fetchAppData = fetchAppData;
