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
          // Find the most recent session (excluding current device)
          const otherSessions = activeSessions.filter(s => s.device_id !== deviceId);
          
          if (otherSessions.length > 0) {
            // Sort by last_active to find the most recent other session
            const sortedOtherSessions = otherSessions.sort(
              (a, b) => new Date(b.last_active) - new Date(a.last_active)
            );
            const mostRecentOtherSession = sortedOtherSessions[0];
            
            // Find current session
            const currentSession = activeSessions.find(s => s.device_id === deviceId);
            
            // If another device has a more recent login, logout this device
            if (currentSession && mostRecentOtherSession.last_active > currentSession.last_active) {
              // Clean up current session
              await base44.entities.UserSession.delete(currentSession.id);

              // Pop down user from map
              const profiles = await base44.entities.UserProfile.filter({
                user_email: user.email
              });
              if (profiles.length > 0 && profiles[0].is_popped_up) {
                await base44.entities.UserProfile.update(profiles[0].id, {
                  is_popped_up: false,
                  popup_message: ''
                });
              }

              // Show notification and logout
              toast.error('Your account is logged in on another device', {
                description: 'You have been logged out from this device.',
                duration: 5000
              });

              setTimeout(() => {
                base44.auth.logout();
              }, 2000);
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