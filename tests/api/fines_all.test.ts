import { GET } from '@/app/api/fines/all/route';

describe('/api/fines/all', () => {
  it('retrieves all fines', async () => {
    const req = new Request('http://localhost:3000/api/fines/all', { method: 'GET' });
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});
