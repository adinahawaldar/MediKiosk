import React, { useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  DEFAULT_STATIC_SUMMARY_DATA,
  downloadDoctorSummaryPdfDirect,
  openDoctorSummaryPdfWindow,
  openDocGeneratorHtmlWindow,
  generateSummaryHTMLString,
} from '../../utils/generateDoctorSummaryPdf';

interface DoctorSummaryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorSummaryPreviewModal: React.FC<DoctorSummaryPreviewModalProps> = ({ isOpen, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const data = DEFAULT_STATIC_SUMMARY_DATA;

  const handleDownloadHtml = () => {
    const htmlString = generateSummaryHTMLString(data);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Doctor_Clinical_Summary_${data.ampathId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenDocGenerator = () => {
    openDocGeneratorHtmlWindow(data);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadDoctorSummaryPdfDirect(data);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    openDoctorSummaryPdfWindow(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Doctor Clinical Summary (AMPATH Format)</h3>
              <p className="text-xs text-slate-300">Pre-Consultation Intake Report for Treating Physician</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenDocGenerator}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Open full screen Doctor_Clinical_Summary_00366.html"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Document (.html)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Content (Embedded Original HTML) */}
        <div className="flex-1 w-full h-[70vh] bg-slate-100 p-2 sm:p-4">
          <iframe
            src="/assets/Doctor_Clinical_Summary_00366.html"
            title="Doctor Clinical Summary"
            className="w-full h-full border-0 rounded-2xl bg-white shadow-sm"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Ready for Physician Sign-off & EHR Transfer</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenDocGenerator}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Open Full Document in New Window →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
