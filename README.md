# pcto

Questo progetto è stato migrato da un backend Python Flask a una soluzione frontend Angular con un server di distribuzione in TypeScript.

## Avvio

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Compila il server TypeScript:
   ```bash
   npm run build
   ```

3. Avvia l'applicazione:
   ```bash
   npm start
   ```

   In alternativa puoi usare lo script equivalente:
   ```bash
   npm run serve
   ```

   Se la porta `8080` è già occupata, il server proverà automaticamente `8081`.

   Per forzare una porta diversa, usa:
   ```bash
   PORT=8081 npm start
   ```

L'app frontend statico è servita dalla cartella `dist/angular-app-temp`.
