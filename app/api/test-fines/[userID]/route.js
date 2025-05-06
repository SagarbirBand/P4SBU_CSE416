export async function GET(req, { params }) {
  const { userID } = params;

  if (process.env.NODE_ENV !== 'k6test') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  await new Promise((res) => setTimeout(res, 120));

  return new Response(JSON.stringify({
    fines: [
      { id: 301, userID, amount: 35, reason: 'Parking in a restricted area', date: '2025-04-21' },
      { id: 302, userID, amount: 50, reason: 'Meter expired', date: '2025-04-22' },
    ],
  }), { status: 200 });
}
