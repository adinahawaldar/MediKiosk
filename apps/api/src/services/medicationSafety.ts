export interface MedicationSafetyResult {
  warnings: string[];
  isConflict: boolean;
}

/** Deterministic MVP guardrails used when the AI medication service is unavailable. */
export const deterministicMedicationSafetyCheck = (
  allergies: string[] = [],
  proposedMedications: string[] = [],
  currentMedications: string[] = [],
): MedicationSafetyResult => {
  const warnings: string[] = [];
  const allergyValues = allergies.map((value) => value.toLowerCase());
  const currentValues = currentMedications.map((value) => value.toLowerCase());

  proposedMedications.forEach((medication) => {
    const med = medication.toLowerCase();
    allergyValues.forEach((allergy) => {
      if (allergy && (med.includes(allergy) || allergy.includes(med))) {
        warnings.push(`Direct match conflict: Prescribed medication '${medication}' matches patient allergen '${allergy}'.`);
      } else if (allergy.includes('penicillin') && /(amoxicillin|ampicillin|cillin)/.test(med)) {
        warnings.push(`Class cross-reactivity: Prescribed medication '${medication}' may conflict with '${allergy}'.`);
      } else if (allergy.includes('nsaid') && /(ibuprofen|aspirin|naproxen)/.test(med)) {
        warnings.push(`Class warning: Prescribed NSAID '${medication}' may conflict with '${allergy}'.`);
      }
    });

    const proposedName = med.split(/\s+/)[0];
    currentValues.forEach((current) => {
      const currentName = current.split(/\s+/)[0];
      if (proposedName === currentName) {
        warnings.push(`Duplicate medication: Patient is already prescribed '${current}'.`);
      }
      const nsaids = ['ibuprofen', 'naproxen', 'aspirin'];
      if (nsaids.includes(proposedName) && nsaids.includes(currentName) && proposedName !== currentName) {
        warnings.push(`Therapeutic duplication: '${medication}' and '${current}' are both NSAIDs.`);
      }
      if ((currentName === 'warfarin' && /^(aspirin|ibuprofen)$/.test(proposedName)) ||
          (proposedName === 'warfarin' && /^(aspirin|ibuprofen)$/.test(currentName))) {
        warnings.push(`Drug-drug interaction: '${medication}' may increase bleeding risk with '${current}'.`);
      }
      if ((currentName === 'lisinopril' && proposedName === 'spironolactone') ||
          (proposedName === 'lisinopril' && currentName === 'spironolactone')) {
        warnings.push(`Drug-drug interaction: '${medication}' may increase potassium levels with '${current}'.`);
      }
    });
  });

  return { warnings: [...new Set(warnings)], isConflict: warnings.length > 0 };
};
