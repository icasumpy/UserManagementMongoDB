# UserManagementMongoDB frontend

React Native + Expo SDK 58 client for Web and Android. Copy `.env.example` to `.env` if it does not exist, then configure `EXPO_PUBLIC_API_URL`. Use the computer's LAN IP (not `localhost`) for Android devices.

The app includes a responsive Admin sign-in page and protected dashboard. Dashboard activity and user metrics are intentionally empty until user-management APIs are implemented; navigation and logout controls are functional.

```powershell
npm install
npm run web       # Web
npm run android   # Android emulator/device
```

Admin web sessions use the backend's HttpOnly cookie; Android stores its bearer JWT with `expo-secure-store`. The app does not persist web tokens in `localStorage`.
