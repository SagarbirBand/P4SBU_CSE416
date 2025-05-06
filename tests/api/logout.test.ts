import { GET } from '@/app/api/logout/route';

describe('/api/logout', () => {
  it('logs out the user', async () => {
    const req = new Request('http://localhost:3000/api/logout', {
      method: 'GET',
    });

    const response = await GET(req);

    expect([302, 307]).toContain(response.status);
expect(response.headers.get('location')).toBe('http://localhost:3000/');

  });
});

