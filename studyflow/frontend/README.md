# StudyFlow

StudyFlow is a React dashboard backed by the Express API and MongoDB in the sibling `backend` folder.

## Run locally

1. In `backend/.env`, set the existing MongoDB connection:

   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
   PORT=5000
   ```

   If Node's SRV lookup cannot use the system resolver, optionally set DNS servers as a comma-separated list:

   ```env
   MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
   ```

   The backend uses that setting when present. If Node is configured only with a loopback DNS stub, it falls back to Google and Cloudflare DNS for MongoDB SRV lookups.

2. Start the backend from `backend/`:

   ```sh
   npm install
   npm run dev
   ```

   The API starts after MongoDB connects. For MongoDB Atlas, allow the development machine's IP in Atlas Network Access.

3. Start the frontend from `studyflow/frontend/`:

   ```sh
   npm install
   npm run dev
   ```

   The frontend uses `http://localhost:5000/api` by default. Override it with `VITE_API_URL` when the backend runs elsewhere.

## API resources

- `/api/goals` — existing Study Goals endpoints
- `/api/projects` — project GET, POST, PUT, DELETE
- `/api/notes` — note GET, POST, PUT, DELETE
