# TPT Emergency System - User Guide

## Unit Login & Authentication

This system includes a complete role-based authentication system with different access levels for emergency response personnel.

---

## 🎯 Login Credentials

Default demo accounts:

| Username | Role | Access Level |
|----------|------|--------------|
| `admin` | System Administrator | Full system access |
| `dispatch` | Emergency Dispatcher | Dispatch operations |
| `commander` | Field Commander | On scene incident management |
| `responder` | First Responder | Field unit access |

All accounts use any password for demo purposes.

---

## 🔐 Login Process

1. Open the application
2. Login interface will be presented on first load
3. Enter your assigned username
4. Click Login
5. You will be automatically granted permissions appropriate for your role

---

## 🚗 Field Unit Login

For vehicle mounted units:
1. Select **Vehicle Mode** from the sidebar
2. Enter unit identifier
3. Vehicle mode will activate with simplified interface
4. Unit status and location will be automatically tracked
5. All radio controls and beacon monitoring is enabled

---

## 👤 User Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **System Administrator** | Full access, user management, system configuration, audit logs |
| **Emergency Dispatcher** | Create incidents, dispatch units, view full map |
| **Field Commander** | Update incident status, allocate resources, perform triage |
| **First Responder** | View assigned incidents, update unit status, view map |
| **Observer** | Read only access to incidents and map |

---

## 📱 Offline Login

The system supports full offline authentication:
- User credentials are cached locally after first login
- You can login and operate completely offline
- All actions are queued and synced when connectivity is restored
- Session remains valid for 72 hours offline

---

## 🚪 Logout

1. Click user profile in top right corner
2. Select Logout
3. You will be returned to the login screen

All unsynced data will be preserved locally and synchronized when you login again.

---

## Session Management

- Sessions automatically timeout after 8 hours of inactivity
- You can be logged in on multiple devices simultaneously
- Administrators can view and terminate active sessions
- All login events are recorded in the audit log