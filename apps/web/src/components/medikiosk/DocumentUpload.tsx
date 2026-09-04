import React, { useRef, useState } from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';

interface Props { patientProfile: any; }

const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const DocumentUpload: React.FC<Props> = ({ patientProfile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Other'>('Prescription');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setError(''); setStatus('Reading document...');
    if (!allowed.includes(file.type)) { setError('Upload a PDF, JPG, PNG, or WEBP document.'); setStatus(''); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Document must be smaller than 8 MB.'); setStatus(''); return; }
    if (!consent) { setError('Please provide consent before digitizing this document.'); setStatus(''); return; }
    const contentBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('Could not read document'));
      reader.readAsDataURL(file);
    });
    try {
      setStatus('Extracting clinical information...');
      const res = await fetch('/api/v1/medikiosk/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentGiven: true, fileName: file.name, mimeType: file.type, contentBase64, documentType, patientProfile }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(typeof data.error === 'string' ? data.error : 'OCR processing failed');
      setStatus(`Digitized ${file.name} as a draft. You can upload another document.`);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) { setError(err.message || 'OCR processing failed'); setStatus(''); }
  };

  return <section className="w-full border border-slate-200 rounded-2xl p-4 text-left space-y-3 bg-slate-50">
    <div className="flex items-center gap-2"><FileUp className="w-4 h-4 text-indigo-600" /><h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Digitize old medical records</h3></div>
    <p className="text-[11px] text-slate-500">Upload a prescription, lab report, or discharge summary. It will be stored as a draft for physician review.</p>
    <div className="flex gap-2"><select value={documentType} onChange={(e) => setDocumentType(e.target.value as any)} className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold"><option>Prescription</option><option>Lab Report</option><option>Discharge Summary</option><option>Other</option></select><button type="button" onClick={() => inputRef.current?.click()} disabled={!consent} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Choose file</button></div>
    <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
    <label className="flex items-start gap-2 text-[11px] text-slate-600"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /><span className="flex gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />I consent to digitizing this document for the current consultation.</span></label>
    {status && <p className="text-xs font-semibold text-indigo-700">{status}</p>}{error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
  </section>;
};

export default DocumentUpload;
