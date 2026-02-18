"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Mic,
  Square,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="font-semibold text-text-primary text-[15px]">
            Registra la spesa
          </h1>
          <Link
            href="/lista"
            className="flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            Lista
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-text-secondary text-center text-sm mb-10">
          Premi il microfono e di&apos; cosa ti serve
        </p>

        {/* Mic button with animated ring */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Animated rings when recording */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-danger/20 animate-pulse-ring" />
                <div
                  className="absolute inset-0 rounded-full bg-danger/10 animate-pulse-ring"
                  style={{ animationDelay: "0.4s" }}
                />
              </>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-danger scale-110"
                  : isProcessing
                  ? "bg-text-tertiary cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark hover:scale-105 active:scale-95"
              }`}
              style={{
                boxShadow: isRecording
                  ? "0 8px 32px rgba(225, 112, 85, 0.4)"
                  : isProcessing
                  ? "none"
                  : "0 8px 32px rgba(108, 92, 231, 0.4)",
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-9 h-9 text-white animate-spin" />
              ) : isRecording ? (
                <Square className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Mic className="w-9 h-9 text-white" />
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-text-tertiary mb-8">
          {isRecording
            ? "Sto ascoltando... Premi per fermare"
            : isProcessing
            ? "Sto elaborando il vocale..."
            : "Premi per iniziare a registrare"}
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-danger-light border border-danger/20 rounded-xl p-4 mb-4">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className="bg-surface rounded-xl border border-border p-5 space-y-4"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1">
                Trascrizione
              </p>
              <p className="text-text-secondary text-sm italic">
                &ldquo;{result.transcript}&rdquo;
              </p>
            </div>

            {result.items.length > 0 ? (
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium mb-2">
                  Prodotti aggiunti ({result.items.length})
                </p>
                <ul className="space-y-1.5">
                  {result.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2.5 text-sm text-text-primary bg-success-light rounded-lg px-3 py-2.5"
                    >
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                      {item.quantity && (
                        <span className="text-text-tertiary text-xs ml-auto">
                          {item.quantity}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">{result.message}</p>
            )}

            <Link
              href="/lista"
              className="flex items-center justify-center gap-2 w-full bg-primary/10 text-primary text-sm font-medium py-2.5 rounded-xl hover:bg-primary/20 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Vai alla lista
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
