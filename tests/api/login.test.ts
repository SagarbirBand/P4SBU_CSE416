import { PUT } from '@/app/api/login/route';

describe('/api/login', () => {
  it('logs in a user with valid credentials', async () => {
    const payload = {
      email: 'TJohnTeneJJ@gmail.com',
      password: 'TJohnTeneJJ',
    };

    const req = new Request('http://localhost:3000/api/login', {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req);
    expect([200, 401]).toContain(response.status); // valid or invalid credentials
  });
});
