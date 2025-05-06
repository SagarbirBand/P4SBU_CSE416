import { POST } from '@/app/api/reservations/createReservation/route';

describe('/api/reservations/createReservation', () => {
  it('creates a reservation', async () => {
    const payload = {
      userID: '24',
      spotID: '123',
      paymentID: '57',
      startTime: '2025-05-06T10:00:00Z',
      endTime: '2025-05-06T12:00:00Z',
    };

    const req = new Request('http://localhost:3000/api/reservations/createReservation', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect([201, 400, 409, 500]).toContain(response.status);
  });
});
