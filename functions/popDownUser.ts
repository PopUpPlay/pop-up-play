import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Try to get token from request body (for sendBeacon)
    let base44;
    let user;
    
    try {
      const body = await req.json();
      if (body.token) {
        // Use token from body
        base44 = createClient({
          token: body.token,
          appId: Deno.env.get('BASE44_APP_ID')
        });
      } else {
        // Fall back to normal request-based auth
        base44 = createClientFromRequest(req);
      }
    } catch {
      // If body parsing fails, use request-based auth
      base44 = createClientFromRequest(req);
    }
    
    user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
      user_email: user.email 
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