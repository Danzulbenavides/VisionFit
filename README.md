# VisionFit

VisionFit is an eyewear e-commerce application that combines online eyewear shopping with facial analysis, personalized frame recommendations, prescription management, and virtual try-on.

## Project Overview

VisionFit consists of four main components:

- **Frontend** – React Native / Expo mobile application for customers
- **Backend** – Node.js, Express, and MongoDB API
- **AI Service** – Python FastAPI service using MediaPipe for facial analysis
- **Admin Web** – React + Vite + TypeScript web application for administrators

## Main Features

### Customer Mobile App
- User registration and login
- Product browsing and product details
- Face scanning
- Facial measurements
- Personalized eyewear recommendations
- Virtual try-on
- Prescription management
- Favorites
- Reviews
- Shopping cart
- Checkout and orders
- Address management
- Educational Hub

### Backend
- JWT authentication
- Role-based access control
- User management
- Product management
- Face scan processing
- Facial measurements
- Recommendation processing
- Virtual try-on processing
- Prescription management
- Cart management
- Order management
- Favorites
- Reviews
- Address management
- Analytics

### AI Service
- FastAPI
- MediaPipe Face Mesh
- Facial landmark detection
- Face measurement analysis
- Face shape analysis

### Admin Web
- Admin authentication
- Dashboard
- Product management
- Inventory monitoring
- Order management
- User management

## Technology Stack

### Frontend
- React Native
- Expo
- JavaScript
- Axios
- React Navigation

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

### AI
- Python
- FastAPI
- MediaPipe
- Uvicorn

### Admin Web
- React
- Vite
- TypeScript
- Axios
- React Router

## Project Structure

```text
VisionFit/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   └── utils/
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── ai-service/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
│
├── admin-web/
│   ├── src/
│   │   ├── api/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── router/
│   ├── package.json
│   └── vite.config.ts
│
├── package.json
├── package-lock.json
└── README.md


Requirements

Install the following before running VisionFit:

Node.js
npm
Python 3.x
MongoDB
Git
Expo Go (for testing the mobile application)
Installation

Clone the repository:

git clone https://github.com/Danzulbenavides/VisionFit.git
cd VisionFit
Backend
cd backend
npm install

Create a .env file based on:

.env.example

Do not commit the .env file.

Start the backend:

npm run dev

or:

node server.js
AI Service

Open another terminal:

cd ai-service
python -m venv venv

Activate the virtual environment.

Windows PowerShell:

venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Start the AI service:

uvicorn main:app --host 0.0.0.0 --port 8000
Frontend

Open another terminal:

cd frontend
npm install

Start Expo:

npx expo start

Use Expo Go or an available development platform to run the mobile application.

Admin Web

Open another terminal:

cd admin-web
npm install
npm run dev

The Vite development server normally runs at:

http://localhost:5173
Environment Variables

Sensitive configuration must remain in local .env files.

The repository includes:

backend/.env.example

Each developer should create their own local .env file from the example.

Never commit:

.env
node_modules/
venv/
__pycache__/
.expo/
Running the System

For local development, the main services are:

Mobile App
    │
    ▼
Node.js / Express Backend
    │
    ├── MongoDB
    │
    └── Python AI Service

The administrator uses:

Admin Web
    │
    ▼
Node.js / Express Backend
