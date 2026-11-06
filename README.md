# PortalHQ — B2B Client Portal & Business Collaboration Platform

> *"One Portal. Every Client. Every Operation."*  
> A full-stack enterprise web application built with **React.js** (frontend) + **Django REST Framework** (backend) + **Relational Database** according to the PortalHQ Software Requirements Specification (SRS v1.1).

---

## 🌐 Live Production Deployment

Access the platform live from any device (phone, tablet, PC):

* 🚀 **Live Web Application (Vercel):** [https://portal-hq-os.vercel.app/](https://portal-hq-os.vercel.app/)
* ⚡ **Live REST API & Backend (Render):** [https://portalhq.onrender.com/api/](https://portalhq.onrender.com/api/)
* 🛠️ **Live Django Administration:** [https://portalhq.onrender.com/admin/](https://portalhq.onrender.com/admin/)

---

## 👥 Demo Login Credentials

The live deployment includes 1-click autofill buttons on the login screen, or you can use these seeded credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| 👑 **Organization Admin** | `admin@portalhq.com` | `admin123` | Full access across all 11 modules, settings, and reports |
| 💼 **Staff / Employee** | `employee@portalhq.com` | `emp123` | Scoped delivery dashboard (tasks, assigned projects & tickets) |
| 🤝 **Client** | `client@portalhq.com` | `client123` | Self-service portal (deliverables, approvals, ticket submissions) |

*You can also create a custom account anytime by clicking **"Need an account? Sign Up"** on the login page.*

---

## 🗂️ Project Structure

```
PortalHQ/
├── backend/                  ← Django 4.2 + Django REST Framework + Database
│   ├── config/               ← Project settings, JWT auth, and master URL routing
│   ├── requirements.txt      ← Python dependencies (Gunicorn, Whitenoise, DRF)
│   ├── build.sh              ← Automated cloud deployment script
│   └── apps/                 ← 11 feature modules conforming to SRS v1.1
│       ├── accounts/         ← Custom User model, JWT authentication, RBAC
│       ├── clients/          ← Client management & 360° profile views
│       ├── projects/         ← 6-stage lifecycle project management
│       ├── milestones/       ← Milestones & interactive task checklist
│       ├── documents/        ← Document storage, versions, and metadata
│       ├── approvals/        ← Deliverable review & client approval workflow
│       ├── tickets/          ← 6-stage support ticket system & discussion threads
│       ├── communication/    ← Announcements, meetings, and notifications
│       ├── assets_mgmt/      ← Hardware & software asset custody registry
│       ├── inventory/        ← Stock inventory & all 7 movement types
│       └── reports/          ← Operational reporting & system audit logs
│
└── frontend/                 ← React 18 + Vite + Tailwind CSS
    ├── package.json          ← Node dependencies (Lucide icons, Axios, React Router)
    ├── vite.config.js        ← Vite bundler & API proxy configuration
    ├── tailwind.config.js    ← Custom PortalHQ theme & color palette
    ├── vercel.json           ← SPA client routing configuration
    └── src/
        ├── api/              ← Axios HTTP services with JWT auto-refresh
        ├── context/          ← AuthContext for role-based sessions
        ├── components/       ← Reusable UI library (Button, Modal, Table, etc.)
        └── pages/            ← Admin, Employee, and Client workspaces (41 screens)
```

---

## 💻 Local Development Setup

If you want to run the project locally on your machine:

### 1. Run the Backend (Django)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate       # On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # On Mac/Linux: cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```
*Local API will be live at `http://localhost:8000` (Django Admin at `http://localhost:8000/admin`).*

### 2. Run the Frontend (React)
Open a new terminal tab:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend will be live at `http://localhost:3000` (or `http://localhost:5173`).*

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Modern, component-based user interface |
| **Styling** | Tailwind CSS v3 | Utility-first, responsive design system |
| **Icons** | Lucide React | Clean, intuitive icons |
| **API Client** | Axios | REST communication with JWT interceptors |
| **Backend Framework** | Django 4.2 + DRF | Layered architecture, REST APIs, and business logic |
| **Authentication** | SimpleJWT | Stateless token-based authentication & RBAC |
| **Database** | SQLite / PostgreSQL | Relational data persistence with Django ORM |
| **Web Server** | Gunicorn + WhiteNoise | Production-ready WSGI server and static asset delivery |
| **Cloud Hosting** | Vercel (UI) + Render (API) | Zero-configuration global cloud deployment |

---

## 📄 License & Attribution
Developed for the Software Project Design and Development Lab (Course Code: CSE0613316) based on the **PortalHQ Software Requirements Specification (v1.1)**.
