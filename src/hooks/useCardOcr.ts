import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import {
  ExtractedDocumentData,
  extractAadhaarFields,
  extractDlFields,
  applyExtractedDataToForm
} from '../utils/cardOcrExtractor';

export type ExtractedCardData = ExtractedDocumentData;
export type { ExtractedDocumentData };
export { applyExtractedDataToForm };

export interface OcrProcessResult {
  data: ExtractedDocumentData;
  warning?: string;
  success: boolean;
}

/**
 * Preprocesses image on an HTML Canvas:
 * Crops card bounding box, converts to high-contrast grayscale to dramatically improve OCR accuracy.
 */
export const preprocessCardCanvas = (
  source: HTMLVideoElement | HTMLImageElement,
  cropRect?: { x: number; y: number; width: number; height: number }
): string => {
  const canvas = document.createElement('canvas');
  const naturalWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const naturalHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

  const width = cropRect ? cropRect.width : (naturalWidth || 1280);
  const height = cropRect ? cropRect.height : (naturalHeight || 720);
  const sx = cropRect ? cropRect.x : 0;
  const sy = cropRect ? cropRect.y : 0;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw source image
  ctx.drawImage(source, sx, sy, width, height, 0, 0, width, height);

  try {
    // Apply grayscale and contrast stretch
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Grayscale conversion
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast boost
      const contrast = 1.35;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      const adjusted = factor * (gray - 128) + 128;
      const finalVal = Math.min(255, Math.max(0, adjusted));

      d[i] = finalVal;
      d[i + 1] = finalVal;
      d[i + 2] = finalVal;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Cross-origin fallback, proceed with raw canvas
  }

  return canvas.toDataURL('image/jpeg', 0.92);
};

/**
 * Real client-side OCR extraction using Tesseract.js with high-precision field-by-field regex parsing
 */
export const processCardImage = async (
  imageDataUrl: string,
  docType: 'DL' | 'AADHAAR',
  onProgress?: (progress: number, status: string) => void
): Promise<OcrProcessResult> => {
  try {
    onProgress?.(10, 'Initializing optical OCR engine...');

    const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = Math.round(15 + m.progress * 80);
          onProgress?.(pct, `Recognizing text (${Math.round(m.progress * 100)}%)...`);
        } else if (m.status) {
          onProgress?.(15, `${m.status}...`);
        }
      }
    });

    onProgress?.(95, 'Extracting designated regex fields & validating expiry...');
    
    let result: ExtractedDocumentData;
    let warningMessage = '';

    if (docType === 'DL') {
      result = extractDlFields(text);
      if (result.warning) {
        warningMessage = result.warning;
      }
    } else {
      result = extractAadhaarFields(text);
    }

    onProgress?.(100, 'OCR extraction complete!');
    return {
      data: result,
      warning: warningMessage,
      success: Boolean(
        result.dlNumber ||
        result.aadhaarNumber ||
        result.expiryDate ||
        result.dlExpiryDate ||
        result.fullName ||
        result.pinCode ||
        result.address
      )
    };
  } catch (err: any) {
    console.error('Tesseract OCR Error:', err);
    return {
      data: {},
      warning: `OCR extraction failed: ${err.message || 'Could not parse text'}`,
      success: false
    };
  }
};

/**
 * React Hook for handling Card OCR workflow
 */
export const useCardOcr = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedCardData | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanCard = useCallback(
    async (imageDataUrl: string, docType: 'DL' | 'AADHAAR'): Promise<OcrProcessResult> => {
      setIsProcessing(true);
      setProgress(5);
      setStatusText('Preparing image for optical scanning...');
      setError(null);
      setWarningMessage(null);

      try {
        const result = await processCardImage(imageDataUrl, docType, (pct, status) => {
          setProgress(pct);
          setStatusText(status);
        });

        setExtractedData(result.data);
        if (result.warning) {
          setWarningMessage(result.warning);
        }
        setIsProcessing(false);
        return result;
      } catch (err: any) {
        setIsProcessing(false);
        const errMsg = err.message || 'Unknown OCR error';
        setError(errMsg);
        return {
          data: {},
          warning: errMsg,
          success: false
        };
      }
    },
    []
  );

  const resetOcr = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setStatusText('');
    setExtractedData(null);
    setWarningMessage(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    statusText,
    extractedData,
    warningMessage,
    error,
    scanCard,
    resetOcr
  };
};
