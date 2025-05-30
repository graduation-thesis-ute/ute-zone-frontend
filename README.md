# UTE Zone 

A social network platform exclusively for the University of Technology and Education (UTE) community, connecting students, teachers, and staff members. The platform consists of three main components: Frontend Application, Backend API, and Content Management System (CMS).

## 🎯 Overview

UTE Zone is a modern social networking platform designed specifically for the UTE community, providing a space for students, teachers, and staff to connect, share, and interact. The platform is built using a microservices architecture with three main components:

1. **Frontend Application** ([ute-zone-frontend](https://github.com/graduation-thesis-ute/ute-zone-frontend)): The main social network interface for community members
2. **Backend API** ([ute-zone-backend](https://github.com/graduation-thesis-ute/ute-zone-backend)): The core server handling social interactions and data management
3. **Content Management System** ([ute-zone-cms](https://github.com/graduation-thesis-ute/ute-zone-cms)): Administrative interface for managing community content and users

## 🌐 Live Demo

You can access the deployed versions of each component here:

- **Frontend Application**: https://ute-zone-frontend.onrender.com/
- **Backend API**: https://ute-zone-backend.onrender.com/
- **Content Management System**: https://ute-zone-cms.onrender.com/
  
## 🚀 Features

### Frontend Application
- User authentication (Google OAuth, Email) for UTE community members
- Social networking features (posts, comments, likes)
- Real-time chat and notifications
- Community groups and events
- Profile customization
- News and announcements feed
- Responsive design for all devices

### Backend API
- RESTful API architecture
- Real-time communication using Socket.IO
- AI integration with LangChain and Hugging Face
- File management with Cloudinary
- Email notifications
- PDF processing
- Secure authentication with JWT
- Swagger API documentation

### CMS (Content Management System)
- Dashboard with analytics
- User management
- Course content management
- System monitoring
- Data visualization with Recharts
- Administrative controls

## 🛠️ Tech Stack

### Frontend Application
- React 18 with TypeScript
- Vite for build tooling
- React Router v7 for routing
- TailwindCSS for styling
- Socket.IO Client for real-time features
- React OAuth for Google authentication
- React Toastify for notifications
- Various UI components (Lucide React, React Datepicker)

### Backend API
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT for authentication
- LangChain and Hugging Face for AI features
- Cloudinary for file storage
- Nodemailer for email services
- Swagger for API documentation
- Various security packages (bcryptjs, crypto-js)

### CMS
- React 19 with TypeScript
- Vite for build tooling
- React Router v7
- TailwindCSS for styling
- Recharts for data visualization
- React Toastify for notifications
- Date-fns and Dayjs for date handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn
- Git
- Cloudinary account (for file storage)
- Google OAuth credentials
- OpenAI API key (for AI features)

## 🚀 Getting Started

Since UTE Zone consists of three separate repositories, you'll need to clone and set up each one individually:

### Frontend Application
```bash

# Clone the frontend repository
git clone https://github.com/graduation-thesis-ute/ute-zone-frontend.git
cd ute-zone-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Backend API
```bash
# Clone the backend repository
git clone https://github.com/graduation-thesis-ute/ute-zone-backend.git
cd ute-zone-backend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Content Management System
```bash
# Clone the CMS repository
git clone https://github.com/graduation-thesis-ute/ute-zone-cms.git
cd ute-zone-cms

# Install dependencies
npm install

# Start the development server
npm start
```

3. Environment Setup

Create `.env` files in each project directory:

**Frontend (.env)**
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
```

**CMS (.env)**
```env

```

4. Start the development servers
```bash
# Start backend server (from ute-zone-backend directory)
npm run dev

# Start frontend server (from ute-zone-frontend directory)
npm start

# Start CMS server (from ute-zone-cms directory)
npm start
```

## 📁 Project Structure

```

ute-zone-frontend/          # Frontend application
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── utils/            # Utility functions
└── public/               # Static files

ute-zone-backend/          # Backend API
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
└── test/               # Test files

ute-zone-cms/            # Content Management System
├── src/
|   ├── components/     # React components
|   ├── pages/         # Page components
|   ├── services/      # API services
|   └── utils/         # Utility functions
└── public/            # Static files
```

## 📝 API Documentation

The API documentation is available at:  `/api-docs` (Swagger UI)

## 🔒 Security

- JWT-based authentication
- Google OAuth integration
- Password encryption with bcrypt
- CORS protection
- Rate limiting
- Input validation
- Secure file uploads
- Environment variable protection


## 📞 Contact

For any questions, suggestions, or support regarding this project, please feel free to reach out:

- **Email:** vohuutai2369@gmail.com  
- **GitHub:** https://github.com/vohuutai23
- **LinkedIn:** www.linkedin.com/in/vohuutai23


## 🙏 Acknowledgments

- University of Technology and Education (UTE)
- All contributors and maintainers
- Open source community for the amazing tools and libraries
- Special thanks to the development team
