import { useState } from 'react';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);

    const verificarPermisos = async (): Promise<boolean> => {
        const perm = await VoiceRecorder.hasAudioRecordingPermission();
        if (!perm.value) {
            const request = await VoiceRecorder.requestAudioRecordingPermission();
            return request.value;
        }
        return true;
    };

    const iniciarGrabacion = async () => {
        const tienePermiso = await verificarPermisos();
        if (!tienePermiso) {
            throw new Error('Se requiere permiso de micrófono para continuar.');
        }
        await VoiceRecorder.startRecording();
        setIsRecording(true);
    };

    const detenerGrabacion = async (): Promise<{ base64: string; mimeType: string } | null> => {
        const result = await VoiceRecorder.stopRecording();
        setIsRecording(false);

        if (result.value && result.value.recordDataBase64) {
            return {
                base64: result.value.recordDataBase64,
                mimeType: result.value.mimeType || 'audio/aac'
            };
        }
        return null;
    };

    return { isRecording, iniciarGrabacion, detenerGrabacion };
};