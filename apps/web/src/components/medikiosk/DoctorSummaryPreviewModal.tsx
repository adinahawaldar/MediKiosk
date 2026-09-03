import React from 'react';
import { X, Printer, Download, FileText, CheckCircle } from 'lucide-react';
import { DEFAULT_STATIC_SUMMARY_DATA, openDoctorSummaryPdfWindow, generateSummaryHTMLString } from '../../utils/generateDoctorSummaryPdf';

interface DoctorSummaryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorSummaryPreviewModal: React.FC<DoctorSummaryPreviewModalProps> = ({ isOpen, onClose }) => {
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
              onClick={handlePrintPdf}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Save as PDF or Print"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Download HTML File"
            >
              <Download className="w-4 h-4" />
              <span>HTML File</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-slate-900 font-sans text-xs max-w-3xl mx-auto space-y-4">
            
            {/* Header */}
            <div className="text-center font-black text-base underline tracking-wide text-slate-900 pb-2">
              AMPATH Guide Adult Summary as of: {data.summaryDate}
            </div>

            {/* Personal History */}
            <div>
              <div className="font-black text-xs underline mb-1 uppercase tracking-wider text-slate-800">
                Personal History:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">for initial visit</div>
                  <div>Initial AMPATH Visit: <u className="font-bold text-slate-900">{data.initialVisitDate}</u></div>
                </div>
                <div>
                  <div>Age: <u className="font-bold text-slate-900">{data.age}</u></div>
                  <div>Benefit Category: <u className="font-bold text-slate-900">{data.benefitCategory}</u></div>
                </div>
                <div>
                  <div>AMPATH ID: <u className="font-bold text-slate-900">{data.ampathId}</u></div>
                  <div>Care Site: <u className="font-bold text-slate-900">{data.careSite}</u></div>
                  <div>Marital Status: <u className="font-bold text-slate-900">{data.maritalStatus}</u></div>
                  <div>Children: <u className="font-bold text-slate-900">{data.numChildren}</u></div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <div className="font-black text-xs underline mb-1 uppercase tracking-wider text-slate-800">
                Medical History:
              </div>
              <table className="w-full text-left border-collapse">
                <tbody>
                  {data.medicalHistory.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5 font-bold text-slate-900 w-2/3">{item.condition}</td>
                      <td className="py-1.5 font-bold text-slate-600">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Drug History */}
            <div>
              <div className="font-black text-xs underline mb-1 uppercase tracking-wider text-slate-800">
                Drug History
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">ARV treatment before AMPATH?</div>
                  <div className="font-black text-slate-900 pl-3">{data.arvTreatmentBefore}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Initial AMPATH ARV regimen?</div>
                  <div className="font-black text-slate-900 pl-3">{data.initialArvRegimen}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Current AMPATH ARV regimen?</div>
                  <div className="font-black text-slate-900 pl-3">{data.currentArvRegimen}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Anti TB Drugs?</div>
                  <div className="font-black text-slate-900 pl-3">{data.antiTbDrugs}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Current AMPATH OI regimen?</div>
                  <div className="font-black text-slate-900 pl-3">{data.currentOiRegimen}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Other drugs prescribed last visit?</div>
                  <div className="font-black text-slate-900 pl-3">{data.otherDrugsLastVisit}</div>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-slate-200 font-bold text-slate-800">
                  Adherence Perfect [Last Visit]?: &nbsp;&nbsp;<u className="font-black text-slate-900">{data.adherence}</u>
                </div>
              </div>
            </div>

            {/* Vitals & Lab Results Table */}
            <div>
              <div className="font-black text-xs underline mb-1 uppercase tracking-wider text-slate-800">
                Laboratory & Vitals History Grid
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-2 border-slate-900 text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900">
                      <th className="border border-slate-900 p-2 text-left font-black">Test / Parameter</th>
                      <th className="border border-slate-900 p-2 font-black">Initial Result</th>
                      <th colSpan={3} className="border border-slate-900 p-2 font-black">Last Three Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vitalsAndLabs.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900">
                        <td className="border border-slate-900 p-2 text-left font-black bg-slate-50">{row.param}</td>
                        <td className="border border-slate-900 p-2">
                          <div className="text-[10px] text-slate-500 font-medium">{row.initial.date}</div>
                          <div className="font-black text-slate-900">{row.initial.value}</div>
                        </td>
                        {[0, 1, 2].map((colIdx) => {
                          const res = row.lastThree[colIdx];
                          return (
                            <td key={colIdx} className="border border-slate-900 p-2">
                              {res ? (
                                <>
                                  <div className="text-[10px] text-slate-500 font-medium">{res.date}</div>
                                  <div className="font-black text-slate-900">{res.value}</div>
                                </>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clinical Reminders */}
            <div className="border-t border-dashed border-slate-400 pt-3 mt-4 space-y-2">
              <div className="font-black text-xs underline uppercase tracking-wider text-slate-800">
                Clinical Reminders & AI Pre-Consultation Notes:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
                {data.clinicalNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ol>
            </div>

            {/* Doctor Sign-off */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-500 font-bold border-t border-slate-200 mt-4">
              <div>System: HospitalOS MediKiosk Intake</div>
              <div className="border-t border-slate-900 pt-1 text-slate-900 w-48 text-center">
                Doctor Signature / Stamp
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Ready for Physician Sign-off & EHR Transfer</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintPdf}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
