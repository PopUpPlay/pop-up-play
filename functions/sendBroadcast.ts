import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { subject, message } = await req.json();

    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Create broadcast message
    const broadcast = await base44.asServiceRole.entities.BroadcastMessage.create({
      sender_email: user.email,
      subject: subject || '',
      message: message.trim(),
      recipient_count: allUsers.length
    });

    // Create individual user broadcast records
    const userBroadcasts = allUsers.map(u => ({
      broadcast_id: broadcast.id,
      user_email: u.email,
      read: false
    }));

    await base44.asServiceRole.entities.UserBroadcast.bulkCreate(userBroadcasts);

    return Response.json({
      success: true,
      broadcast_id: broadcast.id,
      recipients: allUsers.length,
      message: 'Broadcast sent successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});