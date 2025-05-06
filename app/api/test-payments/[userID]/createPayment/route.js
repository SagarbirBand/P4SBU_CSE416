export async function POST(req) {
  if (process.env.NODE_ENV !== 'k6test') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const body = await req.json();

  await new Promise((res) => setTimeout(res, 150));

  return new Response(JSON.stringify({
    success: true,
    paymentID: Math.floor(Math.random() * 9000 + 1000),
    received: body,
    status: 'mock-submitted'
  }), { status: 200 });
}
