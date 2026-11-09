// src/lib/speechRecognition.ts
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';

function transcribirWeb(language: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechClass) {
            reject(new Error('Navegador no compatible con Web Speech API. Usa Chrome o prueba en el celular.'));
            return;
        }

        const recognition = new SpeechClass();
        recognition.lang = language;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => resolve(e.results[0][0].transcript);
        recognition.onerror = (e: any) => reject(new Error(`Web Speech Error: ${e.error}`));
        recognition.onend = () => reject(new Error('No se detectó audio'));
        recognition.start();
    });
}

export async function transcribirUnaFrase(language = 'es-ES'): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
        return transcribirWeb(language);
    }

    const disp = await SpeechRecognition.available();
    if (!disp.available) {
        throw new Error('El servicio de reconocimiento no está disponible en este dispositivo.');
    }

    const perm = await SpeechRecognition.requestPermissions();
    if (perm.speechRecognition !== 'granted') {
        throw new Error('Permiso de reconocimiento denegado.');
    }

    const r = await SpeechRecognition.start({
        language,
        maxResults: 1,
        popup: false,
        partialResults: false,
    });
    await SpeechRecognition.stop().catch(() => { });
    return r.matches?.[0] ?? '';
}