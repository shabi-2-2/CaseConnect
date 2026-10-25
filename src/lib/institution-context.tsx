'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SAMPLE_INSTITUTIONS } from '@/data/mockData';

export interface InstitutionProfileData {
  code: string;
  name: string;
  type: string;
  state: string;
  district: string;
  region: string;
  address: string;
  principalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  nodalOfficerName?: string;
  nodalOfficerEmail?: string;
  nodalOfficerPhone?: string;
  website?: string;
}

interface InstitutionContextValue {
  activeCode: string;
  setActiveCode: (code: string) => void;
  activeInstitution: InstitutionProfileData;
  availableInstitutions: { code: string; name: string; region: string }[];
  refreshProfile: () => Promise<void>;
}

const DEFAULT_CODE = '1-3329182741'; // Apex Institute of Technology & Engineering

const defaultInst = SAMPLE_INSTITUTIONS.find((i) => i.code === DEFAULT_CODE) || SAMPLE_INSTITUTIONS[0];

const initialProfile: InstitutionProfileData = {
  code: defaultInst.code,
  name: defaultInst.name,
  type: defaultInst.type,
  state: defaultInst.state,
  district: defaultInst.district,
  region: defaultInst.region,
  address: defaultInst.address,
  principalName: defaultInst.principalName,
  contactEmail: defaultInst.contactEmail,
  contactPhone: defaultInst.contactPhone,
  nodalOfficerName: 'Dr. Ramesh Chandra (Dean Academics)',
  nodalOfficerEmail: 'nodal.grievance@apextech.edu.in',
  nodalOfficerPhone: '+91 11 2689 4402',
  website: 'https://apextech.edu.in',
};

const InstitutionContext = createContext<InstitutionContextValue>({
  activeCode: DEFAULT_CODE,
  setActiveCode: () => {},
  activeInstitution: initialProfile,
  availableInstitutions: [],
  refreshProfile: async () => {},
});

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const [activeCode, setActiveCodeState] = useState<string>(DEFAULT_CODE);
  const [activeProfile, setActiveProfile] = useState<InstitutionProfileData>(initialProfile);

  // Available institutions for evaluator switcher
  const availableInstitutions = React.useMemo(() => {
    return SAMPLE_INSTITUTIONS.map((inst) => ({
      code: inst.code,
      name: inst.name,
      region: inst.region,
    }));
  }, []);

  const fetchProfileForCode = async (code: string) => {
    try {
      const res = await fetch(`/api/institution/profile?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setActiveProfile(data.profile);
        return;
      }
    } catch {}

    // Fallback to sample
    const fallback = SAMPLE_INSTITUTIONS.find((i) => i.code === code) || SAMPLE_INSTITUTIONS[0];
    setActiveProfile({
      code: fallback.code,
      name: fallback.name,
      type: fallback.type,
      state: fallback.state,
      district: fallback.district,
      region: fallback.region,
      address: fallback.address,
      principalName: fallback.principalName,
      contactEmail: fallback.contactEmail,
      contactPhone: fallback.contactPhone,
      nodalOfficerName: 'Dr. Ramesh Chandra (Dean Academics)',
      nodalOfficerEmail: `nodal@${fallback.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`,
      nodalOfficerPhone: '+91 11 2689 4402',
      website: `https://${fallback.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`,
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('caseconnect_active_institution_code');
      if (saved && SAMPLE_INSTITUTIONS.some((i) => i.code === saved)) {
        setActiveCodeState(saved);
        fetchProfileForCode(saved);
        return;
      }
    } catch {}
    fetchProfileForCode(DEFAULT_CODE);
  }, []);

  const setActiveCode = (code: string) => {
    setActiveCodeState(code);
    try {
      localStorage.setItem('caseconnect_active_institution_code', code);
    } catch {}
    fetchProfileForCode(code);
  };

  const refreshProfile = async () => {
    await fetchProfileForCode(activeCode);
  };

  return (
    <InstitutionContext.Provider
      value={{
        activeCode,
        setActiveCode,
        activeInstitution: activeProfile,
        availableInstitutions,
        refreshProfile,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  return useContext(InstitutionContext);
}
