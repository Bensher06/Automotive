# MotoZapp - Customer Web Interface

A modern, responsive web application for the Veyzion (MotoZapp) Multi-Vendor Automotive Services and Parts Marketplace.

## Features

- **Authentication & Onboarding**
  - Login/Sign Up pages
  - Profile setup with vehicle details
  - Protected routes

- **Home Page**
  - Hero section with emergency mechanic button
  - Search functionality
  - Featured categories
  - Top rated shops

- **Marketplace**
  - Browse products from multiple vendors
  - Advanced filters (category, shop, price range)
  - Product cards with add to cart

- **Mechanic Finder**
  - GPS-based mechanic location (placeholder map)
  - Available/Busy status indicators
  - Service request functionality
  - Emergency mode

- **Service Booking**
  - Schedule appointments with shops
  - Date/time picker
  - Vehicle information integration

- **User Dashboard**
  - Active orders tracking
  - Service history
  - Notifications center
  - Profile information

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** (Mobile-first, fully responsive)
- **React Router DOM** for routing
- **Lucide React** for icons
- **Context API** for state management
- **Leaflet** (ready for map integration)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx
│   ├── ShopCard.jsx
│   ├── EmergencyButton.jsx
│   └── ProtectedRoute.jsx
├── contexts/            # React Context providers
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── ProfileSetup.jsx
│   ├── Home.jsx
│   ├── Marketplace.jsx
│   ├── MechanicFinder.jsx
│   ├── ServiceBooking.jsx
│   └── Dashboard.jsx
├── utils/              # Utility functions and mock data
│   └── mockData.js
├── App.jsx             # Main app component with routing
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Authentication Flow

1. User signs up → Creates account
2. Redirected to Profile Setup → Enter vehicle details, phone, address
3. Profile complete → Access to all features
4. Login → Direct access (if profile is complete)

## Mock Data

The application uses mock data for:
- Products
- Shops
- Mechanics
- Orders
- Service history
- Notifications

All mock data is located in `src/utils/mockData.js`

## Design System

- **Primary Color**: Deep blue (#1e3a8a)
- **Responsive**: Mobile-first design
- **Icons**: Lucide React
- **Typography**: System font stack

## Notes

- Authentication is currently mocked (localStorage-based)
- Map functionality uses a placeholder (Leaflet is installed and ready)
- Cart functionality is local to the Marketplace component
- All forms include validation
- Emergency button is accessible from all pages

## Future Enhancements

- Integrate real API endpoints
- Add Leaflet map with actual GPS coordinates
- Implement shopping cart persistence
- Add payment integration
- Real-time notifications
- Image upload for profile pictures

