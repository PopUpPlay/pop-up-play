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
    
    // Create broadcast message record for history
    const broadcast = await base44.asServiceRole.entities.BroadcastMessage.create({
      sender_email: user.email,
      subject: subject || '',
      message: message.trim(),
      recipient_count: allUsers.length
    });

    // Create chat message for each user from admin
    const chatMessages = allUsers
      .filter(u => u.email !== user.email) // Don't send to admin themselves
      .map(u => ({
        sender_email: user.email,
        receiver_email: u.email,
        content: subject ? `📢 ${subject}\n\n${message.trim()}` : `📢 ${message.trim()}`,
        read: false
      }));

    await base44.asServiceRole.entities.Message.bulkCreate(chatMessages);

    return Response.json({
      success: true,
      broadcast_id: broadcast.id,
      recipients: chatMessages.length,
      message: 'Broadcast sent successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});