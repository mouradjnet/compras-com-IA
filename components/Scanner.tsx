import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Zap } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // In a real app, we would use navigator.mediaDevices.getUserMedia
  // For this environment, we will simulate the camera experience
  
  useEffect(() => {
    // Simulate camera initialization delay
    const timer = setTimeout(() => {
      setPermissionGranted(true);
      setScanning(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateScan = () => {
    // Simulate a random barcode scan for demonstration
    const randomCode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    onScan(randomCode.toString());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center text-white">
      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 overflow-hidden flex flex-col items-center justify-center rounded-lg shadow-2xl border border-gray-700">
        
        {!permissionGranted && (
          <div className="flex flex-col items-center animate-pulse">
            <Camera className="w-12 h-12 mb-4 text-blue-500" />
            <p className="text-gray-400">Iniciando câmera...</p>
          </div>
        )}

        {permissionGranted && (
          <>
            {/* Overlay simulation */}
            <div className="absolute inset-0 z-10 pointer-events-none border-[40px] border-black/50">
                <div className="w-full h-1 bg-red-500 opacity-50 absolute top-1/2 -translate-y-1/2 animate-[ping_1.5s_ease-in-out_infinite]" />
            </div>
            
            <div className="z-20 flex flex-col items-center space-y-6">
                <p className="bg-black/60 px-4 py-2 rounded-full text-sm font-medium">Aponte para o código de barras</p>
                
                {/* Simulation Button for Demo Purposes */}
                <button 
                    onClick={handleSimulateScan}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg transform transition active:scale-95"
                >
                    <Zap className="w-5 h-5 fill-current" />
                    <span>Simular Leitura</span>
                </button>
            </div>

            {/* Simulated Camera Feed (Static pattern to look techy) */}
             <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-50" />
          </>
        )}
      </div>
      
      <p className="mt-6 text-gray-400 text-sm max-w-xs text-center">
        Em um dispositivo real, a câmera abriria automaticamente aqui.
      </p>
    </div>
  );
};

export default Scanner;