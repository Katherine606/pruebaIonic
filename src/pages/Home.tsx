import React, { useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonBadge, IonSpinner,
  IonItem, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonLabel, IonTextarea,
  useIonToast, useIonLoading
} from '@ionic/react';
import { micOutline, stopCircleOutline, languageOutline, trashOutline } from 'ionicons/icons';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';

import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { transcribirConElevenLabs } from '../lib/elevenlabs';
import { transcribirUnaFrase } from '../lib/speechRecognition';

const Home: React.FC = () => {
  const [modalidad, setModalidad] = useState<'api' | 'nativo'>('api');
  const [idioma, setIdioma] = useState<string>('es-ES');
  const [transcripcionEs, setTranscripcionEs] = useState<string>('');
  const [grabandoNativo, setGrabandoNativo] = useState<boolean>(false);

  const { isRecording, iniciarGrabacion, detenerGrabacion } = useVoiceRecorder();

  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();

  const notificar = (msg: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    presentToast({
      message: msg,
      duration: 2500,
      color,
      position: 'bottom',
    });
  };

  // ELEVENLABS 
  const procesarAudioElevenLabs = async () => {
    if (!isRecording) {
      try {
        const permiso = await VoiceRecorder.hasAudioRecordingPermission();
        if (!permiso.value) {
          const res = await VoiceRecorder.requestAudioRecordingPermission();
          if (!res.value) {
            notificar('Permiso de micrófono denegado.', 'danger');
            return;
          }
        }

        await iniciarGrabacion();
        notificar('Grabando audio...', 'warning');
      } catch (e: any) {
        notificar(e.message, 'danger');
      }
    } else {
      try {
        await presentLoading({ message: 'Transcribiendo con ElevenLabs' });
        const audio = await detenerGrabacion();
        if (!audio) {
          notificar('No se obtuvo audio válido.', 'danger');
          return;
        }

        const texto = await transcribirConElevenLabs(audio.base64, audio.mimeType);
        setTranscripcionEs(texto);
        notificar('Transcripción completada con éxito.');
      } catch (e: any) {
        notificar(e.message, 'danger');
      } finally {
        await dismissLoading();
      }
    }
  };
// CAPGO NATIVE 
  const procesarAudioNativo = async () => {
    if (grabandoNativo) return;

    try {

      if (Capacitor.isNativePlatform()) {
        const disp = await SpeechRecognition.available();
        if (!disp.available) {
          notificar('Reconocimiento de voz no disponible en este dispositivo.', 'danger');
          return;
        }
        const perm = await SpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== 'granted') {
          notificar('Permiso de reconocimiento denegado.', 'danger');
          return;
        }
      }

      setGrabandoNativo(true);
      notificar('Escuchando en vivo', 'warning');

      const texto = await transcribirUnaFrase(idioma);
      setTranscripcionEs(texto);
      notificar('Transcripción nativa completada.');
    } catch (e: any) {
      notificar(e.message, 'danger');
    } finally {
      setGrabandoNativo(false);
    }
  };

  const limpiar = () => {
    setTranscripcionEs('');
    notificar('Formulario reiniciado.', 'warning');
  };

  const grabandoActivo = modalidad === 'api' ? isRecording : grabandoNativo;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="secondary">
          <IonTitle>Traductor de Voz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">

        <IonSegment value={modalidad} onIonChange={(e) => setModalidad(e.detail.value as 'api' | 'nativo')}>
          <IonSegmentButton value="api">
            <IonLabel>ElevenLabs</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="nativo">
            <IonLabel>Nativo (Capgo)</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Selector de idioma */}
        <IonCard>
          <IonItem lines="none">
            <IonSelect
              label="Idioma hablado"
              labelPlacement="stacked"
              interface="popover"
              value={idioma}
              onIonChange={(e) => setIdioma(e.detail.value)}
            >
              <IonSelectOption value="es-ES">Español (es-ES)</IonSelectOption>
              <IonSelectOption value="en-US">Inglés (en-US)</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonBadge color={grabandoActivo ? 'danger' : 'primary'}>
              {grabandoActivo ? 'Escuchando audio...' : 'Listo para escuchar'}
            </IonBadge>
            <IonCardTitle className="ion-margin-top">
              {modalidad === 'api' ? 'Grabadora (ElevenLabs)' : 'Reconocimiento en Vivo (Capgo)'}
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <div style={{ margin: '20px 0' }}>
              <IonButton
                color={grabandoActivo ? 'danger' : 'primary'}
                fill="outline"
                shape="round"
                size="large"
                onClick={modalidad === 'api' ? procesarAudioElevenLabs : procesarAudioNativo}
              >
                <IonIcon
                  slot="icon-only"
                  icon={grabandoActivo ? stopCircleOutline : micOutline}
                />
              </IonButton>
            </div>

            {grabandoActivo && (
              <div className="ion-margin-top">
                <IonSpinner name="crescent" color="danger" />
                <p style={{ color: 'var(--ion-color-danger)', fontSize: '0.9rem', marginTop: '6px' }}>
                  {modalidad === 'api' ? 'Presiona para detener y enviar' : 'Escuchando por micrófono...'}
                </p>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={languageOutline} /> Transcripción
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonTextarea
              value={transcripcionEs}
              placeholder="El texto transcrito aparecerá aquí"
              autoGrow={true}
              readonly={true}
              rows={4}
            />

            {transcripcionEs && (
              <div className="ion-margin-top" style={{ display: 'flex', gap: '8px' }}>
                <IonButton expand="block" color="medium" fill="outline" style={{ flex: 1 }} onClick={limpiar}>
                  <IonIcon slot="start" icon={trashOutline} />
                  Limpiar
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;