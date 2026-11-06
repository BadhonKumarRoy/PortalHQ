# PortalHQ — B2B Client Portal & Business Collaboration Platform

> A full-stack enterprise web application built with **React.js** (frontend) + **Django REST Framework** (backend) + **SQLite/PostgreSQL** (database).

---

## 🗂️ Project Structure

```
PortalHQ/
├── backend/      ← Django API server (Python)
└── frontend/     ← React.js web app (JavaScript)
```

---

## 🚀 How to Run (Step by Step)

### Step 1 — Run the Backend (Django)

Open a terminal in the `backend/` folder:

```bash
# 1. Create a virtual environment (do this only once)
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 3. Install all Python packages (do this only once)
pip install -r requirements.txt

# 4. Copy the environment file (do this only once)
copy .env.example .env

# 5. Set up the database (do this only once, or when models change)
python manage.py makemigrations
python manage.py migrate

# 6. Create an admin account (do this only once)
python manage.py createsuperuser

# 7. Start the Django server
python manage.py runserver
```

✅ Backend is now running at: **http://localhost:8000**
✅ Admin panel at: **http://localhost:8000/admin**

---

### Step 2 — Run the Frontend (React)

Open a **NEW** terminal in the `frontend/` folder:

```bash
# 1. Install all JavaScript packages (do this only once)
npm install

# 2. Copy the environment file (do this only once)
copy .env.example .env

# 3. Start the React development server
npm run dev
```

✅ Frontend is now running at: **http://localhost:5173**

---

## 👥 User Roles

| Role | What they can do |
|------|-----------------|
| **Admin** | Full access to everything |
| **Employee** | See assigned projects, tasks, tickets |
| **Client** | See their projects, documents, raise tickets |

---

## 📡 API Endpoints

| Module | Base URL |
|--------|----------|
| Authentication | `/api/auth/` |
| Clients | `/api/clients/` |
| Projects | `/api/projects/` |
| Milestones | `/api/milestones/` |
| Documents | `/api/documents/` |
| Approvals | `/api/approvals/` |
| Tickets | `/api/tickets/` |
| Communication | `/api/communication/` |
| Assets | `/api/assets/` |
| Inventory | `/api/inventory/` |
| Reports | `/api/reports/` |

---

## 🛠️ Tech Stack

| Part | Technology |
|------|-----------|
| Frontend UI | React 18 + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| API Calls | Axios |
| Backend | Django 4.2 |
| REST API | Django REST Framework |
| Authentication | JWT (SimpleJWT) |
| Database | SQLite (dev) / PostgreSQL (prod) |
