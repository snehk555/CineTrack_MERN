# 🎬 CineTrack — Advanced Movie Tracking & Management SaaS

CineTrack is a full-stack movie tracking application built with the MERN stack. It features a scalable RESTful API backend, a dynamic React frontend, and an optimized user experience.

## 🚀 Tech Stack
- **Frontend:** React.js, Zustand (Global State Management), React Router, HTML5/CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **External API:** TMDB API
- **Security:** JWT Authentication, HttpOnly Cookies, Role-Based Access Control (RBAC)

## ✨ Key Features
- **Intelligent Search:** Highly optimized live autocomplete search system using the TMDB API with custom debouncing (500ms delay) to minimize API calls.
- **Robust Database Schema:** Dynamic reference models (ObjectIds) in MongoDB establishing efficient one-to-many data relationships for Categories and Genres.
- **Secure Authentication:** JWT-based authentication combined with Role-Based Access Control (RBAC). 
- **Modern SPA Architecture:** Protected routing, dynamic URL parameters, and smooth client-side navigation using React Router.
- **Optimized UI/UX:** Features skeleton loaders during data fetching and advanced event delegation to prevent bubbling bugs.

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/snehk555/CineTrack_MERN.git

## ⚙️ How to Run Locally
1. **Install Backend Dependencies:**
   Navigate to the Backend folder and run `npm install`. Add your `.env` variables (PORT, MONGO_URI, JWT_SECRET). Start the server with `npm run dev`.
2. **Install Frontend Dependencies:**
   Navigate to the Frontend folder and run `npm install`. Start the client with `npm run dev`.