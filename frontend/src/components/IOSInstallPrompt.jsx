import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if on iOS and not already installed as PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = localStorage.getItem('ios-install-dismissed');
    
    if (isIOS && !isStandalone && !dismissed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-in slide-in-from-bottom">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img 
              src="/apple-touch-icon.png" 
              alt="Golf Score" 
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <h3 className="font-bold text-gray-900">Install Golf Score</h3>
              <p className="text-sm text-gray-500">Add to your home screen</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Share className="w-4 h-4 text-primary" />
            </div>
            <span className="text-gray-700">
              Tap the <strong>Share</strong> button in Safari
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <PlusSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="text-gray-700">
              Select <strong>"Add to Home Screen"</strong>
            </span>
          </div>
        </div>
        
        <Button 
          onClick={handleDismiss}
          variant="ghost"
          className="w-full mt-3 text-gray-500"
        >
          Maybe Later
        </Button>
      </div>
    </div>
  );
}
