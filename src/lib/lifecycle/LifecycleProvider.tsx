"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { useReadContract } from "wagmi";
import { AURELITH_ABI, AURELITH_ADDRESS } from "@/lib/flare/contract";

const STORAGE_KEY = "aurelith:lifecycle:v1";
const ZERO_HASH = `0x${"0".repeat(64)}`;

export type StoredPolicy = {
  policyId: Hex;
  creationTransactionHash?: Hex;
  createdBlock?: number;
  form?: {
    amount: string;
    referenceHash: Hex;
    expiryDays: string;
    participants: Array<{ name: string; address: string; share: number }>;
  };
};

type LifecycleEvidence = Record<string, any> | null;

type LifecycleContextValue = {
  current: StoredPolicy | null;
  history: StoredPolicy[];
  policy: any;
  participants: { recipients: readonly string[]; sharesBps: readonly bigint[] } | null;
  evidence: LifecycleEvidence;
  status: number;
  isLoading: boolean;
  isRefreshing: boolean;
  verifierConfigured: boolean;
  selectPolicy: (policy: StoredPolicy) => void;
  refresh: () => Promise<void>;
};

const LifecycleContext = createContext<LifecycleContextValue | null>(null);

async function fetchEvidence() {
  const response = await fetch("/api/lifecycle", { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export function LifecycleProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<StoredPolicy | null>(null);
  const [history, setHistory] = useState<StoredPolicy[]>([]);
  const [evidence, setEvidence] = useState<LifecycleEvidence>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrent(parsed.current ?? null);
        setHistory(parsed.history ?? []);
      } catch {}
    }
    fetchEvidence().then((value) => {
      if (!active || !value) return;
      setEvidence(value);
      if (!stored && value.policyId) {
        const completed = { policyId: value.policyId, creationTransactionHash: value.policyCreationTransactionHash } as StoredPolicy;
        setCurrent(completed);
        setHistory([completed]);
      }
    });
    return () => { active = false; };
  }, []);

  const policyRead = useReadContract({
    address: AURELITH_ADDRESS,
    abi: AURELITH_ABI,
    functionName: "getPolicy",
    args: current?.policyId ? [current.policyId] : undefined,
    query: { enabled: Boolean(current?.policyId), refetchInterval: 15_000 },
  });
  const participantsRead = useReadContract({
    address: AURELITH_ADDRESS,
    abi: AURELITH_ABI,
    functionName: "getParticipants",
    args: current?.policyId ? [current.policyId] : undefined,
    query: { enabled: Boolean(current?.policyId), refetchInterval: 15_000 },
  });

  const selectPolicy = useCallback((next: StoredPolicy) => {
    setCurrent(next);
    setHistory((existing) => {
      const updated = [next, ...existing.filter((item) => item.policyId !== next.policyId)].slice(0, 10);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: next, history: updated }));
      return updated;
    });
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [nextEvidence] = await Promise.all([fetchEvidence(), policyRead.refetch(), participantsRead.refetch()]);
      if (nextEvidence) setEvidence(nextEvidence);
    } finally {
      setIsRefreshing(false);
    }
  }, [participantsRead, policyRead]);

  const policy = policyRead.data as any;
  const participantData = participantsRead.data as readonly [readonly string[], readonly bigint[]] | undefined;
  const participants = participantData ? { recipients: participantData[0], sharesBps: participantData[1] } : null;
  const status = policy ? Number(policy.status) : 0;
  const matchingEvidence = current?.policyId && evidence?.policyId?.toLowerCase() === current.policyId.toLowerCase() ? evidence : null;
  const verifierConfigured = evidence?.fdc?.verifierStatus === "VALID";

  const value = useMemo(() => ({
    current,
    history,
    policy,
    participants,
    evidence: matchingEvidence,
    status,
    isLoading: Boolean(current?.policyId) && policyRead.isLoading,
    isRefreshing,
    verifierConfigured,
    selectPolicy,
    refresh,
  }), [current, history, policy, participants, matchingEvidence, status, policyRead.isLoading, isRefreshing, verifierConfigured, selectPolicy, refresh]);

  return <LifecycleContext.Provider value={value}>{children}</LifecycleContext.Provider>;
}

export function useLifecycle() {
  const context = useContext(LifecycleContext);
  if (!context) throw new Error("useLifecycle must be used inside LifecycleProvider");
  return context;
}

export function hasHash(value?: string) {
  return Boolean(value && value !== ZERO_HASH);
}
