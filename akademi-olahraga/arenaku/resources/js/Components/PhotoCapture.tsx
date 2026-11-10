import { Camera, ImagePlus, RefreshCw, Trash2, Video } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { buttonClass } from '@/Components/ui';

export default function PhotoCapture({
    file,
    onChange,
    error,
    existingUrl,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    existingUrl?: string | null;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOn(false);
    };

    const startCamera = async () => {
        setCameraError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError('Perangkat ini tidak mendukung kamera. Silakan unggah foto.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraOn(true);
        } catch {
            setCameraError('Kamera tidak dapat diakses. Beri izin kamera atau unggah foto dari galeri.');
        }
    };

    const capture = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth || !video.videoHeight) {
            setCameraError('Kamera belum siap. Coba tunggu sebentar lalu ambil foto lagi.');
            return;
        }

        const size = Math.min(video.videoWidth, video.videoHeight);
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 720;

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        context.drawImage(
            video,
            (video.videoWidth - size) / 2,
            (video.videoHeight - size) / 2,
            size,
            size,
            0,
            0,
            720,
            720,
        );

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    onChange(new File([blob], `foto-member-${Date.now()}.jpg`, { type: 'image/jpeg' }));
                    stopCamera();
                }
            },
            'image/jpeg',
            0.9,
        );
    };

    const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];

        if (selected) {
            onChange(selected);
            setCameraError(null);
        }

        event.target.value = '';
    };

    return (
        <div>
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cameraOn ? 'aspect-square w-full bg-black object-cover' : 'hidden'}
                />

                {!cameraOn && (preview || existingUrl) ? (
                    <img
                        src={preview ?? existingUrl ?? ''}
                        alt="Pratinjau foto member"
                        className="aspect-square w-full object-cover"
                    />
                ) : null}

                {!cameraOn && !preview && !existingUrl ? (
                    <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 p-6 text-center">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate shadow-sm">
                            <Camera className="h-6 w-6" />
                        </span>
                        <p className="text-sm font-semibold text-ink">Foto member (wajib)</p>
                        <p className="max-w-xs text-xs text-slate">
                            Ambil foto langsung dengan kamera atau unggah dari galeri. Wajah anak terlihat jelas.
                        </p>
                    </div>
                ) : null}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickFile}
            />

            <div className="mt-3 flex flex-wrap gap-2">
                {cameraOn ? (
                    <>
                        <button type="button" className={buttonClass('secondary', 'flex-1 px-3 py-2')} onClick={capture}>
                            <Camera className="h-4 w-4" /> Ambil foto
                        </button>
                        <button type="button" className={buttonClass('ghost', 'px-3 py-2')} onClick={stopCamera}>
                            Batal
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className={buttonClass('primary', 'flex-1 px-3 py-2')}
                            onClick={startCamera}
                        >
                            {preview || existingUrl ? <RefreshCw className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            {preview || existingUrl ? 'Ambil ulang dengan kamera' : 'Nyalakan kamera'}
                        </button>
                        <button
                            type="button"
                            className={buttonClass('ghost', 'px-3 py-2')}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-4 w-4" /> Unggah foto
                        </button>
                        {file ? (
                            <button
                                type="button"
                                className={buttonClass('ghost', 'px-3 py-2 text-rose')}
                                onClick={() => onChange(null)}
                            >
                                <Trash2 className="h-4 w-4" /> Batalkan foto baru
                            </button>
                        ) : null}
                    </>
                )}
            </div>

            {cameraError ? <p className="mt-2 text-sm text-amber">{cameraError}</p> : null}
            {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}
        </div>
    );
}
