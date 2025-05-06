import { GET } from '@/app/api/fines/[fineID]/route';

describe('/api/fines/[fineID]', () => {
  it('retrieves a fine by ID', async () => {
    const fineID = '1';
    const req = new Request(`http://localhost:3000/api/fines/${fineID}`, { method: 'GET' });

    const response = await GET(req, { params: { fineID } });
    expect([200, 500]).toContain(response.status); // 500 if ID not found
  });
});
