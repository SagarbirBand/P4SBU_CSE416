import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '45s', target: 150 },
    { duration: '30s', target: 0 },
  ],
};

const users = Array.from({ length: 150 }, (_, i) => ({
  email: `testuser${i}@example.com`,
  password: 'testpass123',
}));

export default function () {
  const user = users[__VU % users.length];
  const userID = 1;

  const loginRes = http.post('http://localhost:3000/api/test-login', JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' }
  });
  check(loginRes, { 'login OK': (r) => r.status === 200 });

  http.get('http://localhost:3000/dashboard');

  check(http.get(`http://localhost:3000/api/test-reservations/${userID}`), {
    'reservations loaded': (r) => r.status === 200,
  });

  check(http.get(`http://localhost:3000/api/test-fines/${userID}`), {
    'fines loaded': (r) => r.status === 200,
  });

  check(http.get(`http://localhost:3000/api/test-payments/${userID}`), {
    'payments loaded': (r) => r.status === 200,
  });

  const paymentBody = JSON.stringify({
    userID,
    fineID: 1,
    amount: 50
  });

  check(http.post('http://localhost:3000/api/test-payments/createPayment', paymentBody, {
    headers: { 'Content-Type': 'application/json' }
  }), {
    'payment submitted': (r) => r.status === 200,
  });

  sleep(1);
}
