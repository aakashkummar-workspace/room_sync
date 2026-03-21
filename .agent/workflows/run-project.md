---
description: how to run the CasaSync project locally
---

To run the CasaSync project locally, you need to start both the backend and frontend servers in separate terminals.

### 1. Run the Backend
// turbo
1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Start the FastAPI server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 2. Run the Frontend
// turbo
1. Open a second terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev -- --port 3000 --host 127.0.0.1
   ```

Once both servers are running, access the app at [http://127.0.0.1:3000](http://127.0.0.1:3000).
