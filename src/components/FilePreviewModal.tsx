import React, { useEffect, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { SubmissionFileMeta } from '../types/school';
import { formatFileSize, getFileBlob, triggerFileDownload } from '../utils/fileStorage';

interface FilePreviewModalProps {
  fileMeta: SubmissionFileMeta | null;
  studentName?: string;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileMeta,
  studentName,
  onClose,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blobData, setBlobData] = useState<Blob | null>(null);

  useEffect(() => {
    if (!fileMeta) {
      setObjectUrl(null);
      setTextPreview(null);
      setBlobData(null);
      return;
    }

    let revokedUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setTextPreview(null);

    getFileBlob(fileMeta.fileId)
      .then(async (record) => {
        if (cancelled) return;
        if (!record) {
          setLoading(false);
          return;
        }
        setBlobData(record.blob);
        const type = record.fileType || fileMeta.fileType;
        if (type.startsWith('text/') || fileMeta.fileName.endsWith('.md') || fileMeta.fileName.endsWith('.txt')) {
          const text = await record.blob.text();
          if (!cancelled) setTextPreview(text);
        } else if (type.startsWith('image/') || type === 'application/pdf') {
          const url = URL.createObjectURL(record.blob);
          revokedUrl = url;
          if (!cancelled) setObjectUrl(url);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [fileMeta]);

  if (!fileMeta) return null;

  const handleDownload = () => {
    if (blobData) {
      triggerFileDownload(blobData, fileMeta.fileName);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-preview-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h3 id="file-preview-title" className="text-base font-semibold text-slate-900 truncate">
              {fileMeta.fileName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {studentName ? `${studentName} · ` : ''}
              {formatFileSize(fileMeta.fileSize)} · Enviado em{' '}
              {new Date(fileMeta.uploadedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!blobData}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar arquivo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500">
              Carregando arquivo enviado...
            </div>
          ) : textPreview !== null ? (
            <pre className="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {textPreview}
            </pre>
          ) : objectUrl && fileMeta.fileType.startsWith('image/') ? (
            <div className="flex items-center justify-center">
              <img
                src={objectUrl}
                alt={fileMeta.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] rounded-lg border border-slate-200 object-contain bg-white"
              />
            </div>
          ) : objectUrl && fileMeta.fileType === 'application/pdf' ? (
            <iframe
              src={objectUrl}
              title={fileMeta.fileName}
              className="w-full h-[60vh] rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">
                Pré-visualização direta indisponível para este formato
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Clique em “Baixar arquivo” acima para abrir o documento completo no seu dispositivo.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!blobData}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar {fileMeta.fileName}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
