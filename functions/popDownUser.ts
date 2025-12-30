import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try to get user from auth, fall back to request body
    let userEmail;
    try {
      const user = await base44.auth.me();
      userEmail = user?.email;
    } catch {
      // If auth fails (e.g., sendBeacon without headers), get email from body
      const body = await req.json();
      userEmail = body?.user_email;
    }
    
    if (!userEmail) {
      return Response.json({ error: 'User email required' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
      user_email: userEmail
    });
    
    if (profiles.length > 0 && profiles[0].is_popped_up) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { 
        is_popped_up: false,
        popup_message: ''
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});