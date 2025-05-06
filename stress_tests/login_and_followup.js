import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '20s', target: 50 },
    { duration: '40s', target: 200 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.02'],
  },
};

const users = Array.from({ length: 200 }, (_, i) => ({
  email: `testuser${i}@example.com`,
  password: 'testpass123',
}));

export default function () {
  const user = users[__VU % users.length];

  // 1. Simulate login
  const loginRes = http.post('http://localhost:3000/api/test-login', JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  // 2. Simulate dashboard access (GET request)
  const dashboardRes = http.get('http://localhost:3000/dashboard');

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });

  // 3. Simulate follow-up: fetch user reservations
  const userID = 1; // mock ID if testing dummy route
  const reservationsRes = http.get(`http://localhost:3000/api/test-reservations/${userID}`);

  check(reservationsRes, {
    'reservations loaded': (r) => r.status === 200,
  });

  sleep(Math.random() * 2); // Simulate user think-time
}
