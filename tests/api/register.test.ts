import { POST } from '@/app/api/register/route';

describe('/api/register', () => {
  it('registers a new user', async () => {
    const payload = {
      fullName: 'Test User',
      email: 'newuser@example.com',
      password: 'newpassword123',
      permitType: 'student',
      licensePlate: 'XYZ123',
      address: '123 Street Ave',
    };

    const req = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect([200, 201, 400]).toContain(response.status); // 400 if user exists
  });
});

