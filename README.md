SaaS Task Automation MVP

A modern SaaS platform for managing workspaces, teams, departments, and automated task workflows. Built with a scalable architecture using Django REST Framework and Next.js.

🚀 Features
🔐 Authentication & User Management
User registration and login
JWT authentication
Role-based permissions
User profile management
🏢 Workspace Management
Create and manage workspaces
Invite team members
Workspace roles:
Owner
Admin
Member
Viewer
Workspace statistics dashboard
Subscription plans:
Free
Pro
Business
Enterprise
🏬 Company & Department System
Multi-company support
Department hierarchy
Department managers
Team member organization
✅ Task Management
Create tasks
Assign tasks to members
Task priorities
Due dates
Status tracking
Dashboard analytics
📊 Analytics Dashboard
Workspace statistics
Completed tasks tracking
Overdue task monitoring
Team productivity overview
🛠 Tech Stack
Frontend
Next.js 16
TypeScript
Tailwind CSS
Zustand
Axios
Lucide Icons
Backend
Django
Django REST Framework
PostgreSQL
JWT Authentication
Django Filters
📁 Project Structure
backend/
├── authentication/
├── workspaces/
├── companies/
├── tasks/
├── users/
└── manage.py

frontend/
├── app/
├── components/
├── stores/
├── lib/
├── types/
└── public/
⚙️ Installation
1️⃣ Clone Repository
git clone <your-repo-url>
cd workflow-saas
🔧 Backend Setup (Django)
Create Virtual Environment
python -m venv venv
Activate Virtual Environment
Windows
venv\Scripts\activate
Linux / Mac
source venv/bin/activate
Install Dependencies
pip install -r requirements.txt
Run Migrations
python manage.py makemigrations
python manage.py migrate
Create Superuser
python manage.py createsuperuser
Start Backend Server
python manage.py runserver

Backend runs on:

http://localhost:8000
💻 Frontend Setup (Next.js)
Install Dependencies
npm install
Start Development Server
npm run dev

Frontend runs on:

http://localhost:3000
🔑 Environment Variables
Backend .env
SECRET_KEY=your_secret_key
DEBUG=True

DATABASE_NAME=workflow_saas
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=5432
Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
📡 API Endpoints
Authentication
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
Workspaces
GET    /api/workspaces/
POST   /api/workspaces/
GET    /api/workspaces/{id}/
PUT    /api/workspaces/{id}/
DELETE /api/workspaces/{id}/
Workspace Members
POST /api/workspaces/{id}/invite_member/
POST /api/workspaces/{id}/add_member/
PATCH /api/workspaces/{id}/update_member_role/
DELETE /api/workspaces/{id}/remove_member/
Workspace Stats
GET /api/workspaces/{id}/stats/
Companies
GET    /api/companies/
POST   /api/companies/
GET    /api/companies/{id}/
Departments
GET    /api/departments/
POST   /api/departments/
GET    /api/departments/{id}/
Tasks
GET    /api/tasks/
POST   /api/tasks/
GET    /api/tasks/{id}/
PATCH  /api/tasks/{id}/
DELETE /api/tasks/{id}/
🧠 SaaS Architecture
User
 └── Company
      └── Workspace
           └── Department
                └── Tasks
🔒 Roles & Permissions
Role	Permissions
Owner	Full access
Admin	Manage members & tasks
Member	Create & update tasks
Viewer	Read-only access
📈 Future Improvements
Real-time notifications
WebSocket collaboration
AI task automation
Calendar integrations
File uploads
Activity logs
Stripe billing integration
Email notifications
Kanban board
Mobile app
🧪 Testing
Backend Tests
python manage.py test
Frontend Linting
npm run lint
🚀 Deployment
Backend
Render
Railway
DigitalOcean
AWS
Frontend
Vercel
Netlify
👨‍💻 Author

Built by Alex
