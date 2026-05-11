##     SaaS Task Automation MVP
A modern SaaS platform for task management, workspace collaboration, company organization, and workflow automation built with Next.js, Django REST Framework, and PostgreSQL.
##    🚀 Features
🔐 Authentication & User Management
User registration and login
JWT authentication
Role-based permissions
User profile management
##    🏢 Workspace Management
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
##   🏬 Company & Department System
Multi-company support
Department hierarchy
Department managers
Team member organization
##   ✅ Task Management
Create tasks
Assign tasks to members
Task priorities
Due dates
Status tracking
Dashboard analytics
##   📊 Analytics Dashboard
Workspace statistics
Completed tasks tracking
Overdue task monitoring
Team productivity overview
## 🛠 Tech Stack
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
## 📁roject Structure
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
##⚙️ Installation
Clone Repository
git clone <your-repo-url>
cd workflow-saas
🔧 Backend Setup (Django)
Create Virtual Environment
## 📡 API Endpoints
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
























