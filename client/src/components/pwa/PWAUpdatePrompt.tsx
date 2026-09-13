import { RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

const PWAUpdatePrompt = () => {
  const { isUpdateAvailable, offlineReady, update, closeUpdatePrompt } = usePWA();

  if (!isUpdateAvailable && !offlineReady) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 z-50 max-w-sm"
      >
        <Card className="bg-slate-900 border-slate-700 shadow-2xl">
          <CardContent className="p-6">
            <button
              onClick={closeUpdatePrompt}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-400" />
              </div>
              
              <div className="flex-1">
                {isUpdateAvailable ? (
                  <>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Update Available
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      A new version of the Hopstec portal is available. Update now to get the latest features!
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={update}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Now
                      </Button>
                      <Button
                        onClick={closeUpdatePrompt}
                        variant="ghost"
                        className="text-gray-400 hover:bg-slate-800"
                        size="sm"
                      >
                        Later
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-white mb-1">
                      App Ready for Offline Use
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Hopstec portal is now available offline!
                    </p>

                    <Button
                      onClick={closeUpdatePrompt}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                      size="sm"
                    >
                      Got it!
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;

