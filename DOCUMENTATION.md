# Golden Generation Platform Documentation

## Overview
Golden Generation is a comprehensive platform designed to serve retirees and veterans, facilitating community engagement, event management, and social connections. The platform features multiple user roles (Super Admin, Admin, and Retiree) and provides various services to enhance the retirement community experience.

## Technical Stack

### Frontend
- **Framework**: React (with Vite)
- **State Management**: Zustand
- **UI Components**: 
  - Tailwind CSS
  - Ant Design
  - React Hot Toast
  - Framer Motion
- **Internationalization**: i18next
- **Charts & Analytics**: Recharts

### Backend
- **Server**: Firebase
- **Authentication**: Firebase Authentication
- **Database**: Firebase Realtime Database/Firestore
- **File Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions

## Core Features

### 1. User Management
- Multi-role system (Super Admin, Admin, Retiree)
- User authentication and authorization
- Profile management
- ID verification system

### 2. Event Management
- Calendar system with different views
- Event creation and management
- Event categories
- Participant management
- Real-time updates

### 3. Settlement Management
- Settlement/Town registration
- Admin assignment to settlements
- Geographic organization of communities

### 4. Communication Features
- Real-time notifications
- Messaging system
- Global call functionality using Agora SDK
- Multi-language support (English, Hebrew, Arabic)

### 5. Analytics & Reporting
- Comprehensive analytics dashboard
- Advanced analysis tools
- User engagement metrics
- Event participation tracking

### 6. Additional Services
- Job notifications
- Service requests
- Volunteer opportunities
- Support system

## Component Structure

### Admin Components
- Dashboard
- Event management
- User management
- Analytics
- Settlement management

### Retiree Components
- Personal dashboard
- Event participation
- Service requests
- Volunteer opportunities
- Support access

### Shared Components
- Calendar
- Notifications
- Messages
- Settings
- Profile management

## Security Features
- Protected routes
- Role-based access control
- Secure authentication
- Data encryption
- Input validation

## Internationalization
The platform supports multiple languages:
- English
- Hebrew
- Arabic

All text content is managed through translation files located in `src/translations/`.

## Data Management
- User data
- Event data
- Settlement information
- Analytics data
- Service requests
- Job notifications

## Development Guidelines

### Code Organization
- Components are organized by feature/role
- Shared utilities in `src/utils/`
- Context providers in `src/context/`
- Custom hooks in `src/hooks/`
- Services in `src/services/`

### Best Practices
1. Use TypeScript for type safety
2. Follow component-based architecture
3. Implement proper error handling
4. Maintain code documentation
5. Follow ESLint rules
6. Use proper Git workflow

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Configure Firebase
5. Start development server:
   ```bash
   npm run dev
   ```

## Build and Deployment
- Build command: `npm run build`
- Preview: `npm run preview`
- Deployment using Vercel

## Additional Resources
- Firebase Console for backend management
- Agora Dashboard for video calling features
- Analytics dashboard for monitoring
- Settlement management interface

## Support and Maintenance
- Regular updates
- Security patches
- Performance monitoring
- User support system
- Bug tracking and resolution

---

*This documentation is maintained by the Golden Generation development team. For updates or questions, please contact the development team.* 