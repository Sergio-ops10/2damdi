import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dataService } from '../services/dataService';
import { Upload, FileText, ExternalLink, Download, FileArchive, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const Files = () => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const files = useLiveQuery(() => dataService.getFiles());

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await dataService.uploadFile(file);
            alert(t('files.upload_success', 'Archivo subido con éxito'));
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(t('files.upload_error', 'Error al subir el archivo'));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="page-header">
                <h1>{t('files.title', 'Gestión de Archivos')}</h1>
            </div>

            <div className="grid grid-2">
                {/* Upload Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Upload size={24} className="text-primary" />
                        <h2 style={{ margin: 0 }}>{t('files.upload_new', 'Subir Nuevo Archivo')}</h2>
                    </div>
                    <p className="text-muted mb-1">
                        {t('files.upload_desc', 'Sube recibos, facturas o documentos (PDF, Imágenes, Audio).')}
                    </p>

                    <div style={{ marginTop: '1.5rem' }}>
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,audio/*"
                        />
                        <label htmlFor="fileInput" className="btn btn-primary" style={{ cursor: 'pointer', width: '100%' }}>
                            <Upload size={20} />
                            {uploading ? t('files.uploading', 'Subiendo...') : t('files.choose', 'Seleccionar Archivo')}
                        </label>
                    </div>
                </div>

                {/* Info Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <FileArchive size={24} className="text-muted" />
                        <h2 style={{ margin: 0 }}>{t('files.my_archive', 'Mi Archivo')}</h2>
                    </div>
                    <p className="text-muted">
                        {t('files.storage_info', 'Aquí puedes gestionar todos tus documentos almacenados de forma segura en la nube.')}
                    </p>
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem', border: '1px solid var(--primary-color)' }}>
                        <span style={{ fontSize: '0.85rem' }}>Total: {files?.length || 0} {t('files.items', 'elementos')}</span>
                    </div>
                </div>
            </div>

            {/* Gallery Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>{t('files.recent', 'Mis Documentos')}</h2>

                <div className="grid grid-3">
                    {files?.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }} className="text-muted">
                            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>{t('files.no_files', 'No hay archivos subidos aún.')}</p>
                        </div>
                    )}

                    {files?.map((file) => (
                        <div key={file.id} className="card" style={{
                            padding: '1.25rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginBottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FileText className="text-primary" size={24} />
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {file.name}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        {new Date(file.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                                <button
                                    className="btn"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => window.open(file.url, '_blank')}
                                >
                                    <ExternalLink size={14} />
                                    {t('files.view')}
                                </button>
                                <button
                                    className="btn"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => handleDownload(file.url, file.name)}
                                >
                                    <Download size={14} />
                                    {t('files.download')}
                                </button>
                                <button
                                    className="btn"
                                    style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
                                    onClick={async () => {
                                        if (window.confirm(t('files.delete_confirm', '¿Borrar este archivo?'))) {
                                            await dataService.deleteFile(file.id!, file.url);
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Files;
