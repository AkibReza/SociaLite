# SociaLite - Social Discovery Platform

A modern social discovery platform that connects users through interest-based communities and progressive group experiences.

## Features

- **Interest-Based Matching**: Join communities and get matched with 9 other like-minded people
- **Progressive Group Experience**: 4-phase system that gradually unlocks features over 30 days
- **Real-Time Messaging**: Live group chat with Socket.IO
- **Voice & Video Calls**: WebRTC-powered group calling
- **Friends System**: Build lasting connections beyond group experiences
- **Admin Dashboard**: User management and platform monitoring
- **Mobile Responsive**: Works seamlessly across all devices
- **Dark/Light Mode**: Customizable user interface

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time features
- **Firebase Auth** for authentication
- **Axios** for API requests

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **Firebase Admin SDK** for authentication
- **JWT** for additional security
- **Express Rate Limiting** for API protection

### Services
- **MongoDB Atlas** - Database (Free Tier)
- **Firebase** - Authentication & Real-time features
- **Netlify** - Frontend hosting
- **Render** - Backend hosting

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Firebase project
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd socialite
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
FRONTEND_URL=http://localhost:5173
```

### 3. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google Sign-In
3. Download the service account key and place it in the backend directory
4. Copy your Firebase config for the frontend

### 4. Frontend Setup
```bash
cd ../
npm install
```

Create `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Seed Communities
```bash
cd backend
node src/scripts/seedCommunities.js
```

### 6. Run the Application
Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Group Phase System

### Phase 1 (Days 0-6): Text Chat
- Basic group messaging
- Get to know each other through text

### Phase 2 (Days 7-13): Voice Calls
- Group audio calls enabled
- Voice-based conversations

### Phase 3 (Days 14-20): Video Calls
- Group video calls enabled
- Face-to-face interactions

### Phase 4 (Days 21-30): Personal Messaging
- Private 1-on-1 messaging unlocked
- Build individual connections

After 30 days, groups become inactive but members can add each other as friends.

## Deployment

### Frontend (Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set the build command: `cd backend && npm install`
3. Set the start command: `cd backend && npm start`
4. Add environment variables in Render dashboard

### Database (MongoDB Atlas)
1. Create a free cluster on MongoDB Atlas
2. Whitelist your deployment IPs
3. Create a database user
4. Update connection string in environment variables

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities/:id/join` - Join community queue
- `POST /api/communities/:id/leave` - Leave community queue

### Groups
- `GET /api/groups/current` - Get current group
- `GET /api/groups/current/messages` - Get group messages
- `POST /api/groups/:id/messages` - Send message
- `GET /api/groups/current/members` - Get group members

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/requests/:id/:action` - Accept/reject request

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/stats` - Get admin statistics

## Socket.IO Events

### Client to Server
- `join_group` - Join group room
- `leave_group` - Leave group room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `call_initiated` - Start group call
- `webrtc_offer` - WebRTC offer for peer connection

### Server to Client
- `new_message` - New group message
- `member_status_update` - Member online/offline status
- `group_created` - New group formation
- `friend_request` - New friend request
- `user_typing` - Typing indicator
- `call_initiated` - Group call started

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.#   S o c i a L i t e  
 #   S o c i a L i t e  
 