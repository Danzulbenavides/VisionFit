// Single source of truth for the backend address used by the mobile app.
//
// The phone cannot reach the backend through `localhost`, so this must be the
// LAN IP of the machine running the backend (same network as the phone).
//
// To point the app somewhere else without touching code, create
// `frontend/.env` containing:
//   EXPO_PUBLIC_API_URL=http://<your-ip>:5000/api
export const API_URL =
    (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_API_URL) ||
    "http://192.168.18.240:5000/api";