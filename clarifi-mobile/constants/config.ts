// clarifi-mobile/constants/config.ts

// TODO: Update this URL to match your actual API base URL
// For local development with NestJS (clarifi-api) typically running on port 3000:
// export const API_BASE_URL = 'http://localhost:3000/api';
// Or if your NestJS app is not using a global /api prefix:
// export const API_BASE_URL = 'http://localhost:3000';

// For now, using a placeholder. Ensure your NestJS API is accessible at this address from your mobile device/emulator.
// If using an emulator, localhost might point to the emulator itself.
// You might need to use your machine's local network IP address or a tunneling service like ngrok.
export const API_BASE_URL = 'http://your-api-base-url-here.com/api';

// Example for using a local IP (replace 192.168.1.X with your machine's IP):
// export const API_BASE_URL = 'http://192.168.1.X:3000/api';

// Add other global configurations here if needed
