import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Get message data from request
    const { subject, message } = await req.json();
    
    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Fetch all users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    if (!allUsers || allUsers.length === 0) {
      return Response.json({ error: 'No users found' }, { status: 404 });
    }

    // Send email to each user
    const results = [];
    for (const targetUser of allUsers) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: subject,
          body: message
        });
        results.push({ email: targetUser.email, status: 'sent' });
      } catch (error) {
        results.push({ email: targetUser.email, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return Response.json({
      success: true,
      message: `Broadcast sent to ${successCount} users, ${failedCount} failed`,
      totalUsers: allUsers.length,
      successCount,
      failedCount,
      details: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});