import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Generate a unique device ID stored in localStorage
const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export default function SessionManager() {
  const checkIntervalRef = useRef(null);
  const deviceId = getDeviceId();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const registerSession = async () => {
      try {
        const user = await base44.auth.me();
        if (!mounted) return;

        // Find existing session for this device
        const existingSessions = await base44.entities.UserSession.filter({
          user_email: user.email,
          device_id: deviceId
        });

        const now = new Date().toISOString();

        if (existingSessions.length > 0) {
          // Update existing session
          await base44.entities.UserSession.update(existingSessions[0].id, {
            last_active: now,
            user_agent: navigator.userAgent
          });
        } else {
          // Create new session
          await base44.entities.UserSession.create({
            user_email: user.email,
            device_id: deviceId,
            last_active: now,
            user_agent: navigator.userAgent
          });
        }
      } catch (error) {
        // User not logged in or error occurred
      }
    };

    const checkMultipleSessions = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const user = await base44.auth.me();
        if (!mounted) return;

        // Get all sessions for this user
        const allSessions = await base44.entities.UserSession.filter({
          user_email: user.email
        });

        // Filter out stale sessions (inactive for more than 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const activeSessions = allSessions.filter(
          s => s.last_active > twoMinutesAgo
        );

        // Delete stale sessions
        const staleSessions = allSessions.filter(
          s => s.last_active <= twoMinutesAgo
        );
        for (const session of staleSessions) {
          await base44.entities.UserSession.delete(session.id);
        }

        // Check if there are multiple active sessions
        if (activeSessions.length > 1) {
          // Sort all sessions by last_active to find the oldest
          const sortedSessions = activeSessions.sort(
            (a, b) => new Date(a.last_active) - new Date(b.last_active)
          );
          
          // Delete all sessions except the most recent one
          for (let i = 0; i < sortedSessions.length - 1; i++) {
            const oldSession = sortedSessions[i];
            await base44.entities.UserSession.delete(oldSession.id);
            
            // If the current device was logged out, refresh the page
            if (oldSession.device_id === deviceId) {
              toast.error('Your session was ended due to a login on another device');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              return;
            }
          }
        }
      } catch (error) {
        // User not logged in or error occurred
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Register session immediately
    registerSession();

    // Update session every 30 seconds
    const updateInterval = setInterval(registerSession, 30000);

    // Check for multiple sessions every 10 seconds
    checkIntervalRef.current = setInterval(checkMultipleSessions, 10000);

    return () => {
      mounted = false;
      clearInterval(updateInterval);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [deviceId]);

  return null;
}