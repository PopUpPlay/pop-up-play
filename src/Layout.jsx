import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function Layout({ children }) {
  // Auto pop-down on page unload/close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ 
          user_email: user.email 
        });
        
        if (profiles.length > 0 && profiles[0].is_popped_up) {
          await base44.entities.UserProfile.update(profiles[0].id, { 
            is_popped_up: false,
            popup_message: ''
          });
        }
      } catch (error) {
        // Silently fail
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 139 92 246;
          --primary-foreground: 255 255 255;
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: none;
        }
        
        .leaflet-popup-tip {
          display: none;
        }
        
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'rounded-xl',
        }}
      />
      {children}
    </div>
  );
}