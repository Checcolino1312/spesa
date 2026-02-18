"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface TranscribeResult {
  transcript: string;
  items: { id: string; name: string; quantity?: string }[];
  message: string;
  error?: string;
}

export default function ParlaPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError("Non riesco ad accedere al microfono. Controlla i permessi.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const sendAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data: TranscribeResult = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante l'elaborazione");
      } else {
        setResult(data);
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-orange-600 hover:text-orange-800 text-sm">
            &larr; Home
          </Link>
          <Link href="/lista" className="text-orange-600 hover:text-orange-800 text-sm">
            Vedi lista &rarr;
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Registra la spesa
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Premi il microfono e di&apos; cosa ti serve
        </p>

        {/* Mic button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse scale-110"
                : isProcessing
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95"
            }`}
          >
            {isProcessing ? (
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isRecording ? (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mb-6">
          {isRecording
            ? "Sto ascoltando... Premi per fermare"
            : isProcessing
            ? "Sto elaborando il vocale..."
            : "Premi per iniziare a registrare"}
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Trascrizione</p>
              <p className="text-gray-700 text-sm italic">&ldquo;{result.transcript}&rdquo;</p>
            </div>

            {result.items.length > 0 ? (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Prodotti aggiunti ({result.items.length})
                </p>
                <ul className="space-y-1">
                  {result.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-green-500">&#10003;</span>
                      <span className="font-medium">{item.name}</span>
                      {item.quantity && (
                        <span className="text-gray-400 text-xs">({item.quantity})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
