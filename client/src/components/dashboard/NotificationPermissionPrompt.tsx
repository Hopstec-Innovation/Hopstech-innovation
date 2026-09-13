import { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useNotifications } from '../../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import './portal.css';

interface NotificationPermissionPromptProps {
  onDismiss?: () => void;
}

const NotificationPermissionPrompt = ({ onDismiss }: NotificationPermissionPromptProps) => {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  // Don't show if not supported or already granted/denied
  if (!isSupported || permission !== 'default' || !isVisible) {
    return null;
  }

  const handleEnable = async () => {
    setIsRequesting(true);
    const result = await requestPermission();
    setIsRequesting(false);
    
    if (result === 'granted') {
      setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="portal-notice border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="portal-icon-chip">
                  <Bell className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Enable Desktop Notifications
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Stay updated with real-time notifications about your projects, messages, and invoices.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleEnable}
                      disabled={isRequesting}
                      className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                      size="sm"
                    >
                      {isRequesting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Requesting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Enable Notifications
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPermissionPrompt;

