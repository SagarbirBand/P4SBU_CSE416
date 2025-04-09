import request from 'supertest';
import { createServer } from 'http';
import app from '../../p4sbu/app/api/register/route.js'; // Adjust path as needed

describe('POST /api/register', () => {
  let server;

  beforeAll(() => {
    server = createServer(app);
  });

  afterAll(() => {
    server.close();
  });

  it('should register a user successfully', async () => {
    const response = await request(server)
      .post('/api/register')
      .send({
        fullName: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
        permitType: 'A',
        licensePlate: 'ABC123',
        address: '123 Main St',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(server).post('/api/register').send({
      email: 'johndoe@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });
});
