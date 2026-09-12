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
