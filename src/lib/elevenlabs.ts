
import { base64ToFile, extensionDeMime } from './base64ToFile';

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

export async function transcribirConElevenLabs(base64: string, mimeType: string): Promise<string> {
    if (!API_KEY) throw new Error('Falta configurar api');

    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
    const client = new ElevenLabsClient({ apiKey: API_KEY });

    const ext = extensionDeMime(mimeType);
    const file = base64ToFile(base64, mimeType, `grabacion.${ext}`);

    const transcription = await client.speechToText.convert({
        file,
        modelId: 'scribe_v2',
        tagAudioEvents: true,
        languageCode: 'spa',
        diarize: true,
    } as never);

    return (transcription as { text?: string }).text ?? '';
}