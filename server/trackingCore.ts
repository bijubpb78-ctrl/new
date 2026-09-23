type StripeCheckoutSession = {
  id?: string;
  client_reference_id?: string;
  payment_status?: string;
  created?: number;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function lookupTracking(request: Request, stripeKey?: string): Promise<Response> {
  if (!stripeKey) return json({ success: false, error: 'Tracking is temporarily unavailable.' }, 503);

  let identifier: unknown;
  try {
    identifier = (await request.json() as { identifier?: unknown }).identifier;
  } catch {
    return json({ success: false, error: 'Invalid request.' }, 400);
  }

  const orderId = typeof identifier === 'string' ? identifier.trim().toUpperCase() : '';
  if (!/^FTC-[A-F0-9]{8}$/.test(orderId)) {
    return json({ success: false, error: 'Enter the order ID from your payment confirmation.' }, 400);
  }

  try {
    let startingAfter = '';
    for (let page = 0; page < 5; page += 1) {
      const params = new URLSearchParams({ limit: '100', status: 'complete' });
      if (startingAfter) params.set('starting_after', startingAfter);
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (!response.ok) return json({ success: false, error: 'Unable to verify this order right now.' }, 502);

      const result = await response.json() as { data?: StripeCheckoutSession[]; has_more?: boolean };
      const sessions = Array.isArray(result.data) ? result.data : [];
      const match = sessions.find(
        (session) => session.client_reference_id?.toUpperCase() === orderId && session.payment_status === 'paid'
      );

      if (match) {
        const confirmedAt = match.created
          ? new Date(match.created * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Confirmed';
        return json({
          success: true,
          order: {
            orderId,
            status: 'Order confirmed',
            confirmedAt,
            message: 'Payment was verified. Shipment tracking will appear after the fulfillment carrier issues a tracking number.',
          },
        });
      }

      if (!result.has_more || sessions.length === 0) break;
      startingAfter = sessions[sessions.length - 1]?.id || '';
      if (!startingAfter) break;
    }

    return json({ success: false, error: 'No paid order was found for that ID.' }, 404);
  } catch {
    return json({ success: false, error: 'Unable to verify this order right now.' }, 502);
  }
}
