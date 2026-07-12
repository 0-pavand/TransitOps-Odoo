# 🚛 TransitOps – Smart Transport Operations Platform

> A modern fleet and logistics management platform that transforms manual spreadsheet-based transport operations into an intelligent, centralized, and automated system.

---

## 📌 Overview

TransitOps is a web-based transport operations management platform designed for logistics companies to efficiently manage vehicles, drivers, trip dispatching, maintenance, fuel expenses, and operational analytics.

The platform automates business rules, improves operational visibility, reduces manual errors, and enables role-based collaboration across different departments.

---

# ✨ Key Features

## 🚚 Fleet Management

* Vehicle Registration
* Vehicle Status Tracking
* Vehicle Categories
* Capacity Management
* Odometer Tracking
* Region Management
* Vehicle Availability Monitoring

---

## 👨‍✈️ Driver Management

* Driver Registration
* License Verification
* License Expiry Tracking
* Safety Score Monitoring
* Driver Availability
* Contact Information
* Performance Monitoring

---

## 🛣 Trip Dispatch System

* Create Trips
* Assign Vehicles
* Assign Drivers
* Route Planning
* Cargo Validation
* Dispatch Workflow
* Trip Completion
* Automatic Resource Release

---

## 🔧 Maintenance Management

* Service Scheduling
* Maintenance History
* Workshop Records
* Repair Cost Tracking
* Vehicle Availability Control
* Maintenance Status Workflow

---

## ⛽ Fuel & Expense Management

* Fuel Log Entry
* Expense Tracking
* Vehicle-wise Fuel Consumption
* Operational Cost Analysis
* Maintenance Expenses
* Fuel Efficiency Reports

---

## 📊 Analytics Dashboard

* Fleet Utilization
* Vehicle Status Overview
* Fuel Consumption Trends
* Driver Performance
* Maintenance Statistics
* Operational KPIs
* Revenue & Expense Insights

---

## 🔐 Role-Based Access Control (RBAC)

Four user roles with dedicated permissions:

* Fleet Manager
* Dispatcher
* Safety Officer
* Financial Analyst

Each role has controlled access to specific modules and actions.

---

# 🧠 Automated Business Rules

TransitOps automatically enforces operational rules to eliminate manual errors.

### Vehicle Rules

* Vehicles under maintenance cannot be dispatched.
* Retired vehicles are removed from dispatch availability.
* Vehicle capacity is validated before dispatch.

### Driver Rules

* Drivers with expired licenses cannot be assigned.
* Suspended drivers are hidden from dispatch.
* Only available drivers can receive new trips.

### Trip Rules

* Vehicle availability validation
* Driver availability validation
* License verification
* Cargo capacity validation
* Automatic trip lifecycle management
* Automatic release of driver and vehicle after trip completion

---

# 📈 Dashboard

The dashboard provides a real-time operational overview including:

* Active Vehicles
* Available Vehicles
* Active Trips
* Drivers On Duty
* Fleet Utilization
* Fuel Costs
* Maintenance Alerts
* Recent Trip Activities

---

# 🎨 UI Highlights

* Modern Enterprise Dashboard
* Clean Minimal Design
* Responsive Layout
* Interactive Charts
* Smart Data Tables
* Status Badges
* Animated KPI Cards
* Toast Notifications
* Modal Forms
* Search & Filters
* Role-Based Navigation
* Light & Dark Theme Ready

---

# 🏗 Technology Stack

## Frontend

* React 18
* TypeScript
* Tailwind CSS
* React Router v6
* Axios
* Recharts
* React Hot Toast
* Lucide Icons

---

## Backend

* Python (FASTAPI)
* JWT Authentication
* RESTful APIs

---

## Database

PostgreSQL 

---

# 📂 Project Structure

```text
src/
│
├── components/
├── layouts/
├── pages/
├── routes/
├── services/
├── hooks/
├── context/
├── utils/
├── types/
├── assets/
└── App.tsx
```

---

# 🔄 Workflow

```text
Vehicle Registration
        │
        ▼
Driver Registration
        │
        ▼
Create Trip
        │
        ▼
Validate Driver
        │
        ▼
Validate Vehicle
        │
        ▼
Dispatch Trip
        │
        ▼
Track Progress
        │
        ▼
Complete Trip
        │
        ▼
Update Fuel & Expenses
        │
        ▼
Generate Reports
```

---

# 📊 Core Modules

* Dashboard
* Fleet Management
* Driver Management
* Trip Dispatch
* Maintenance
* Fuel Management
* Expense Tracking
* Analytics
* Reports
* User Management
* Settings

---

# 🚀 Future Enhancements

* AI-Based Smart Dispatch Recommendation
* Live GPS Vehicle Tracking
* Google Maps Integration
* Predictive Maintenance
* QR Code Vehicle Identification
* Driver Performance Leaderboard
* Mobile Application
* Push Notifications
* Document OCR
* AI Route Optimization
* Carbon Emission Tracking

---

# 🎯 Project Objectives

* Replace spreadsheet-based fleet operations
* Improve transport efficiency
* Reduce manual dispatch errors
* Ensure regulatory compliance
* Track operational costs
* Increase fleet utilization
* Improve decision-making using analytics
* Provide secure role-based access

---

# 📌 Target Users

* Logistics Companies
* Transport Agencies
* Fleet Operators
* Manufacturing Companies
* Distribution Networks
* Warehousing Organizations
* Delivery Service Providers

---

# 🔒 Security Features

* JWT Authentication
* Role-Based Authorization
* Protected Routes
* Secure API Communication
* Input Validation
* Error Handling
* Session Management

---

# 🛠️ Local Installation & Backend Setup

To connect the React frontend with the FastAPI backend and run the system locally using PostgreSQL:

### 1. PostgreSQL Database Setup
1. Install PostgreSQL 17 or download the Windows binaries zip package if you don't have administrator rights.
2. Initialize the database directory cluster:
   ```powershell
   .\initdb.exe -D C:\Users\Asus\pgsql\data -U postgres -E UTF8 --locale=C
   ```
3. Start the local PostgreSQL server instance in a separate background console session:
   ```powershell
   Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '"C:\Users\Asus\pgsql\pgsql\bin\postgres.exe" -D "C:\Users\Asus\pgsql\data"' }
   ```
4. Create the `transitops` database:
   ```powershell
   .\createdb.exe -U postgres transitops
   ```

### 2. Backend API Setup
1. Navigate to the `backend` folder.
2. Create and activate a Python virtual environment:
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install Python dependencies (note: `psycopg2-binary` must be version `>=2.9.12` to support prebuilt wheels on Python 3.13):
   ```powershell
   pip install -r requirements.txt
   ```
4. Create a `.env` configuration file in the backend root:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/transitops
   SECRET_KEY=transitops-super-secret-key-change-this-very-long-and-random-12345
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   FUEL_PRICE_PER_LITER=100
   ```
5. Launch the backend server:
   ```powershell
   .\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000
   ```
   *Note: Application startup automatically migrates tables and seeds initial demo roles (`fleet@transitops.com`, `dispatch@transitops.com`, `safety@transitops.com`, `finance@transitops.com`) with the password `password123`.*

### 3. Frontend Integration
1. The frontend API connection is configured in `src/services/api.ts` and maps calls to `http://localhost:8000/api`.
2. The page actions in `src/pages` have been wired through `src/services/mockApi.ts` to execute real asynchronous Axios requests instead of mockup responses, managing camelCase/snake_case translation automatically.
3. Install packages and start the frontend:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local address in the browser (usually `http://localhost:3001/`).

---

# 📄 License

This project is developed for educational, academic, and hackathon purposes. It can be extended and customized for enterprise fleet management solutions.

---

## 👨‍💻 Developed By

**TransitOps Team**

Smart Transport Operations Platform

Built with ❤️ using React, TypeScript, Tailwind CSS, and modern web technologies.
