
import { useState, useEffect } from 'react';
import { X, Play, CheckCircle } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
}

const RewardedAdModal = ({ isOpen, onClose, onAdCompleted }: RewardedAdModalProps) => {
  const [adState, setAdState] = useState<'waiting' | 'playing' | 'completed'>('waiting');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setAdState('waiting');
      setCountdown(30);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (adState === 'playing' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setAdState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adState, countdown]);

  const startAd = () => {
    setAdState('playing');
  };

  const handleComplete = () => {
    onAdCompleted();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={adState === 'playing'}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Watch Ad to Download
          </h3>

          {adState === 'waiting' && (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-8 mb-6">
                <Play className="h-16 w-16 text-white mx-auto mb-4" />
                <p className="text-white text-lg font-medium">
                  Ready to start your ad
                </p>
              </div>
              
              <p className="text-gray-600 mb-6">
                Watch a 30-second ad to unlock your file download
              </p>
              
              <button
                onClick={startAd}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Ad
              </button>
            </>
          )}

          {adState === 'playing' && (
            <>
              <div className="bg-gray-900 rounded-lg p-8 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>
                <div className="relative">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-white text-lg font-medium">
                    Ad Playing...
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-full p-1 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                ></div>
              </div>
              
              <p className="text-gray-600 text-lg font-medium">
                {countdown} seconds remaining...
              </p>
            </>
          )}

          {adState === 'completed' && (
            <>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-8 mb-6">
                <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
                <p className="text-white text-lg font-medium">
                  Ad Complete!
                </p>
              </div>
              
              <p className="text-gray-600 mb-6">
                Thank you for watching! Your download is now ready.
              </p>
              
              <button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Download
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardedAdModal;
