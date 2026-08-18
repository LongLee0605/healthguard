# HealthGuard Mobile

Expo React Native app — connects to the same backend as web.

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

Scan QR with Expo Go, or press `a` (Android) / `i` (iOS).

## Environment (`.env`)

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

**Physical device:** replace `localhost` with your PC's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

**Android emulator:** sometimes needs:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api
```

## Demo account

- Email: `demo@healthguard.vn`
- Password: `Demo@123`

Data syncs with web when using the same account.

## Prerequisites

Backend must be running — see [`../backend/README.md`](../backend/README.md).
