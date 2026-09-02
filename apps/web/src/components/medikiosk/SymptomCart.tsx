import React from 'react';
import type { MappedSymptom } from './BodyModel';
import { Trash2, Edit3, ArrowRight, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

interface SymptomCartProps {
  symptoms: MappedSymptom[];
  onRemoveSymptom: (regionId: string) => void;
  onEditSymptom: (regionId: string) => void;
  onSubmitAssessment: () => void;
  isSubmitting?: boolean;
}

export const SymptomCart: React.FC<SymptomCartProps> = ({
  symptoms,
  onRemoveSymptom,
  onEditSymptom,
  onSubmitAssessment,
  isSubmitting = false,
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
      case 'very_severe':
        return { label: '🔴 SEVERE', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'moderate':
        return { label: '🟠 MODERATE', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'mild':
      default:
        return { label: '🟡 MILD', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[600px]">
      <div>
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Mapped Symptom Cart</h3>
              <p className="text-xs text-slate-500 font-normal">
                {symptoms.length === 0 ? 'No body regions mapped yet' : `${symptoms.length} symptom area(s) mapped on body`}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold">
            {symptoms.length} Selected
          </span>
        </div>

        {/* Mapped Symptoms List */}
        <div className="mt-4 space-y-3 max-h-[390px] overflow-y-auto pr-1 custom-scrollbar">
          {symptoms.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-4xl mb-3">🧍</span>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Touch the 3D Body Model</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Select any body region on the left screen (Chest, Head, Abdomen, Arms, Legs) to add your symptoms.
              </p>
            </div>
          ) : (
            symptoms.map(s => {
              const badge = getSeverityBadge(s.severity);
              return (
                <div
                  key={s.bodyRegion}
                  className="group relative bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        {s.bodyRegion.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                      <span className="capitalize font-bold text-slate-900">{s.symptom}</span>
                      <span>•</span>
                      <span className="text-slate-500">Duration: {s.duration || 'Today'}</span>
                    </div>

                    {s.additionalDetails?.radiates && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Radiates to: {s.additionalDetails.radiatesTo?.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditSymptom(s.bodyRegion)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                      title="Edit symptom"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSymptom(s.bodyRegion)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                      title="Remove symptom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Submit Action Footer */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={onSubmitAssessment}
          disabled={symptoms.length === 0 || isSubmitting}
          className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 text-sm font-extrabold transition-all cursor-pointer ${
            symptoms.length === 0 || isSubmitting
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-98'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Clinical History...</span>
            </div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Submit Body Symptom Map ({symptoms.length})</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SymptomCart;
