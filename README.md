# NibbleMate 🐱

A smart cat feeder management system that helps you create, manage, and schedule feeding for your cats through connected smart feeders.

## Overview

nibbleMate is a comprehensive mobile and web application that allows you to:

- **Create and manage smart feeders** with different food brands
- **Add cats to your household** with detailed profiles
- **Link cats to specific feeders** for personalized feeding
- **Schedule automatic feeding** based on your cats' needs
- **Monitor feeding history** and track your cats' health
- **Manually trigger feeding** when needed

## How It Works

### 1. **Create a Smart Feeder** 🍽️

Start by creating a smart feeder in your account:

- Choose from a variety of food brands (Purina, Royal Canin, Science Diet, etc.)
- The system automatically generates a unique name for your feeder
- Each feeder gets a unique hardware ID for physical device connection
- Feeders can be linked to specific cats or remain unassigned

**Navigation**: Main Page → "Create Feeder" button

### 2. **Add Your Cats** 🐈

Create detailed profiles for each cat in your household:

- **Basic Information**: Name, breed, age, weight, length, sex
- **Feeder Assignment**: Link to a specific smart feeder (optional)
- **Health Tracking**: Monitor weight and feeding patterns over time
- **Microchip Integration**: Automatic microchip detection when available

**Navigation**: Main Page → "Add Cat" button

### 3. **Link Cats to Feeders** 🔗

Connect your cats to their designated feeders:

- **One-to-One Relationship**: Each cat can be linked to one feeder
- **Hardware ID Linking**: Enter the 12-digit hardware ID from your physical feeder
- **Automatic Detection**: System validates hardware IDs and prevents duplicates
- **Easy Management**: Unlink and reassign feeders as needed

**Navigation**: Profile Page → "Link Feeder" section

### 4. **Schedule Feeding** ⏰

Set up automated feeding schedules for each cat:

- **Custom Schedules**: Set multiple feeding times per day
- **Portion Control**: Specify exact calorie amounts per feeding
- **Flexible Timing**: Different schedules for weekdays vs weekends
- **Manual Override**: Trigger immediate feeding when needed

**Navigation**: Main Page → Select a feeder → "Schedule" button

### 5. **Monitor and Manage** 📊

Keep track of your cats' feeding and health:

- **Feeding History**: View detailed logs of all feeding events
- **Health Charts**: Track weight changes and feeding patterns
- **Feeder Status**: Monitor battery levels and connectivity
- **Quick Actions**: Manual feeding, schedule adjustments, and more

## Key Features

### 🔐 **Secure Authentication**
- User registration and login system
- Session management with automatic token refresh
- Secure API communication with your smart feeders

### 📱 **Cross-Platform Support**
- **Mobile Apps**: iOS and Android via React Native
- **Web Interface**: Full-featured web application
- **Responsive Design**: Optimized for all screen sizes

### 🎯 **Smart Feeder Management**
- Support for multiple feeder brands and models
- Real-time connectivity monitoring
- Automatic feeder discovery and setup
- Hardware ID validation and management

### 🐱 **Comprehensive Cat Profiles**
- Detailed health and feeding information
- Breed-specific recommendations
- Weight and growth tracking
- Microchip integration support

### ⏰ **Advanced Scheduling**
- Multiple daily feeding times
- Custom portion sizes
- Weekend vs weekday schedules
- Manual feeding override

### 📈 **Analytics and Monitoring**
- Feeding history and patterns
- Health trend analysis
- Feeder performance metrics
- Export capabilities for veterinary records

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Expo CLI (for mobile development)
- Smart feeder hardware with 12-digit hardware ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nibbleMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your preferred platform**
   - **Web**: Press `w` in the terminal or visit the provided URL
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app

### Backend Setup

NibbleMate requires a backend server for full functionality. See the `/server` directory for backend setup instructions.

## Deployment

### Building for Production

#### 1. **Configure Environment Variables**
Create a `.env` file in the root directory with your production settings:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
API_BASE_URL=your_backend_api_url
```

#### 2. **Build for Web**
```bash
# Install dependencies (if not already done)
npm install

# Build for web production
npx expo export:web

# The built files will be in the `web-build/` directory
# Deploy this directory to your web hosting service (Netlify, Vercel, etc.)
```

#### 3. **Build for Mobile (iOS/Android)**

**For iOS:**
```bash
# Build for iOS
npx expo build:ios

# Or for development builds
npx expo run:ios
```

**For Android:**
```bash
# Build for Android
npx expo build:android

# Or for development builds
npx expo run:android
```

#### 4. **EAS Build (Recommended for Production)**

Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

Login to your Expo account:
```bash
eas login
```

Configure EAS Build:
```bash
eas build:configure
```

Build for production:
```bash
# Build for iOS App Store
eas build --platform ios

# Build for Google Play Store
eas build --platform android

# Build for both platforms
eas build --platform all
```

#### 5. **Publishing Updates**

For over-the-air updates (without app store submission):
```bash
# Publish update
npx expo publish

# Or with EAS
eas update --branch production --message "Bug fixes and improvements"
```

### Deployment Platforms

#### **Web Deployment**
- **Netlify**: Connect your GitHub repo and set build command to `npx expo export:web`
- **Vercel**: Import your project and configure for static export
- **Firebase Hosting**: Deploy the `web-build/` directory

#### **Mobile App Stores**
- **iOS App Store**: Use EAS Build to generate `.ipa` files
- **Google Play Store**: Use EAS Build to generate `.aab` files
- **TestFlight/Internal Testing**: Use EAS Build with appropriate profiles

### Environment Configuration

#### **Development vs Production**
- Development: Uses local backend and development Supabase project
- Production: Uses production backend and production Supabase project

#### **App Configuration**
Update `app.json` for production:
```json
{
  "expo": {
    "name": "NibbleMate",
    "slug": "nibblemate",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.nibblemate"
    },
    "android": {
      "package": "com.yourcompany.nibblemate"
    }
  }
}
```

## Project Structure

```
nibbleMate/
├── app/                    # Main application code
│   ├── (auth)/            # Authentication screens
│   ├── (home)/            # Home and navigation
│   ├── screens/           # Main application screens
│   │   ├── MainPage.tsx   # Dashboard with feeders
│   │   ├── CreateFeeder.tsx
│   │   ├── CreateCatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── Scheduler.tsx
│   │   └── ...
│   ├── components/        # Reusable UI components
│   └── utils/            # Utilities and API hooks
├── assets/               # Images, fonts, and static files
└── server/              # Backend API server
```

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: WebSocket connections
- **Deployment**: Cross-platform (iOS, Android, Web)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation in the `/server` directory
- Review the DEBUG.md file for troubleshooting
- Open an issue on GitHub

---

**NibbleMate** - Making cat care smarter, one feeding at a time! 🐱❤️
