"use client";
import { Toaster, toast as hotToast, ToastBar } from "react-hot-toast";
import { useEffect, useState, useRef } from "react";

// Custom Toast wrapper with enhanced swipe gestures for mobile
function SwipeableToast({ t, children }: { t: any; children: React.ReactNode }) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    e.preventDefault();
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Only allow swipe to right (positive direction)
    if (deltaX > 0) {
      setDragX(deltaX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    e.preventDefault();
    setIsDragging(false);
    
    // If swiped more than 100px, dismiss the toast
    if (dragX > 100) {
      hotToast.dismiss(t.id);
    } else {
      // Snap back to original position
      setDragX(0);
    }
  };

  const transform = dragX > 0 ? `translateX(${dragX}px)` : 'translateX(0px)';
  const opacity = dragX > 0 ? Math.max(0.3, 1 - dragX / 200) : 1;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `${transform} translateZ(0)`,
        opacity,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
        cursor: isMobile ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        position: 'relative',
        width: '100%',
        willChange: isDragging ? 'transform, opacity' : 'auto',
      }}
      className={`${isDragging ? 'select-none' : ''} touch-none`}
    >
      {children}
      {/* Swipe indicator for mobile - overlay assoluto */}
      {isMobile && dragX > 20 && (
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none z-10"
          style={{ 
            opacity: Math.min(1, dragX / 100),
            transition: 'none'
          }}
        >
          
        </div>
      )}
    </div>
  );
}

export default function ToasterProvider() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Toaster 
      position={isMobile ? "top-center" : "top-right"}
      toastOptions={{
        // Durata predefinita
        duration: isMobile ? 6000 : 4000, // Più tempo su mobile per permettere l'interazione
        // Stili personalizzati
        style: {
          maxWidth: isMobile ? '90vw' : '400px',
          wordWrap: 'break-word',
          position: 'relative',
          touchAction: 'pan-y', // Permette solo scroll verticale durante il touch
        },
        // Configurazione per successo
        success: {
          style: {
            border: '1px solid #10b981',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#ecfdf5',
          },
        },
        // Configurazione per errore
        error: {
          style: {
            border: '1px solid #ef4444',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
      }}
      // Configurazione responsive per container
      containerStyle={{
        top: isMobile ? 80 : 20,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : 20,
        bottom: undefined,
        transform: isMobile ? 'none' : undefined,
        zIndex: 9999,
      }}
      gutter={8}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <SwipeableToast t={t}>
              <div className="flex items-center">
                {icon}
                <div className="ml-2 flex-1">{message}</div>
                {isMobile && (
                  <button
                    className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                    onClick={() => hotToast.dismiss(t.id)}
                    aria-label="Chiudi notifica"
                  >
                    ✕
                  </button>
                )}
              </div>
            </SwipeableToast>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}


