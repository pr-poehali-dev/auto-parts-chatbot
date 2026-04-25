import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import Icon from "@/components/ui/icon";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.listVideoInputDevices().then(devices => {
      if (!devices.length) {
        setError("Камера не найдена");
        return;
      }

      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("задн")
      );
      const deviceId = backCamera?.deviceId || devices[devices.length - 1].deviceId;

      reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result, err) => {
        if (result) {
          setScanning(false);
          setDetectedCode(result.getText());
          reader.reset();
          setTimeout(() => {
            onDetected(result.getText());
          }, 800);
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
        }
      });
    }).catch(() => {
      setError("Нет доступа к камере. Разрешите доступ в настройках браузера.");
    });

    return () => {
      reader.reset();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="ScanLine" size={18} className="text-primary" />
            <span className="font-semibold text-foreground text-sm">Сканирование штрихкода</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Камера */}
        <div className="relative bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" />

          {/* Прицел */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-36">
                {/* Угловые рамки */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                {/* Сканирующая линия */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 shadow-[0_0_8px_2px_hsl(var(--primary)/0.4)]" style={{ animation: "scanLine 2s ease-in-out infinite" }} />
              </div>
            </div>
          )}

          {/* Успешное сканирование */}
          {detectedCode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3">
                <Icon name="Check" size={28} className="text-primary-foreground" />
              </div>
              <div className="text-white font-semibold text-sm">Код считан!</div>
              <div className="text-primary font-mono-custom text-xs mt-1">{detectedCode}</div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6 text-center">
              <Icon name="CameraOff" size={36} className="text-muted-foreground mb-3" />
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Подсказка */}
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {scanning && !error ? "Наведите камеру на штрихкод товара" : ""}
            {detectedCode ? "Ищу товар в каталоге..." : ""}
            {error ? "Не удалось получить доступ к камере" : ""}
          </p>
          {(error || detectedCode) && (
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-24px); opacity: 0.4; }
          50% { transform: translateY(24px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
