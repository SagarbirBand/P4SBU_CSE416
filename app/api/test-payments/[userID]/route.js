export async function GET(req, context) {
  const { userID } = await context.params;
  
    if (process.env.NODE_ENV !== 'k6test') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
  
    await new Promise((res) => setTimeout(res, 80 + Math.random() * 120));
  
    return new Response(JSON.stringify({
      payments: [
        { id: 101, amount: 50, fineID: 1, status: 'completed', date: '2025-05-06' },
        { id: 102, amount: 75, fineID: 2, status: 'completed', date: '2025-05-07' }
      ]
    }), { status: 200 });
  }
  