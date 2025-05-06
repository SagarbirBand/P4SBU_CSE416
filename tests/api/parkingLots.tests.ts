import { GET } from '@/app/api/parkingLots/route';

describe('/api/parkingLots', () => {
  it('retrieves list of parking lots', async () => {
    const req = new Request('http://localhost:3000/api/parkingLots', { method: 'GET' });
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});
