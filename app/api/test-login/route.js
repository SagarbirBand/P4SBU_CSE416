// Simulated login endpoint for stress testing without DB access

export async function POST(req) {
    const { email, password } = await req.json();
  
    // Only accept test accounts
    if (!email.startsWith('testuser') || password !== 'testpass123') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  
    // Simulate DB latency between 100ms and 300ms
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
  
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: Math.floor(Math.random() * 9999),
        email,
        name: 'Test User',
      },
    }), { status: 200 });
  }
  