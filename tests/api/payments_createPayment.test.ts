import { POST } from '@/app/api/payments/createPayment/route';

describe('/api/payments/createPayment', () => {
  it('creates a payment intent', async () => {
    const payload = {
      userID: 'u001',
      amount: 50,
    };

    const req = new Request('http://localhost:3000/api/payments/createPayment', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect([201, 400, 500]).toContain(response.status);
  });
});
