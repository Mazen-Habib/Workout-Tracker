# FitTrack Pro - Workout Tracking Mobile App

A modern, full-featured workout tracking application built with React Native and Expo. Track your exercises, monitor progress, and achieve your fitness goals.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

## 🎯 Features

- **Workout Logging**: Add exercises with sets, reps, and weight tracking
- **History Tracking**: View complete workout history with detailed exercise breakdowns
- **Progress Analytics**: Visualize workout frequency and track personal records
- **Data Persistence**: All data saved locally using AsyncStorage
- **Dark Theme UI**: Modern, professional interface optimized for mobile
- **Real-time Updates**: Automatic screen refresh when navigating between tabs

## 📱 Screenshots

[Add screenshots here when you take them]

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage
- **Charts**: React Native Chart Kit
- **Icons**: Expo Vector Icons
- **Date Formatting**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your mobile device

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/workout-tracker.git
cd workout-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npx expo start
```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## 📂 Project Structure
```
workout-tracker/
├── app/
│   ├── (tabs)/           # Tab-based screens
│   │   ├── index.tsx     # Home screen
│   │   ├── log-workout.tsx
│   │   ├── history.tsx
│   │   └── progress.tsx
│   ├── types/            # TypeScript interfaces
│   │   └── workout.ts
│   └── utils/            # Helper functions
│       ├── storage.ts    # AsyncStorage operations
│       ├── helpers.ts    # Utility functions
│       └── stats.ts      # Statistics calculations
├── assets/               # Images and fonts
└── app.json             # Expo configuration
```

## 💡 Key Learning Points

This project demonstrates:
- React Native mobile development
- TypeScript for type safety
- State management with React hooks
- Async data persistence
- Form handling and validation
- Data visualization with charts
- Component-based architecture
- File-based routing with Expo Router

## 🎓 Built As

A practice project to learn React Native before building a larger Next.js application. This project helped solidify React concepts including:
- useState and useEffect hooks
- Component composition
- Props and state management
- Navigation patterns
- Data flow in React applications

## 📝 Future Enhancements

- [ ] Add workout templates
- [ ] Exercise library with demonstrations
- [ ] Rest timer between sets
- [ ] Export data to CSV
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Social features (share workouts)
- [ ] Dark/Light theme toggle
- [ ] Exercise notes and photos

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

[Your Name]
- LinkedIn: [Your LinkedIn]
- GitHub: [Your GitHub]
- Portfolio: [Your Portfolio]

---

**Note**: This is a portfolio/learning project demonstrating mobile development skills with React Native and TypeScript.