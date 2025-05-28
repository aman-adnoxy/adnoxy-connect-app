import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Listing } from '@/types/listing';
import { planService } from '@/services/plan';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/types/plan';

interface PlanContextType {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  addToPlan: (planId: string, listing: Listing) => Promise<void>;
  createPlan: (name: string, listing?: Listing, startDate?: string, endDate?: string) => Promise<Plan>;
  removeFromPlan: (planId: string, listingId: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const userPlans = await planService.getPlans(user.id);
      setPlans(userPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const addToPlan = useCallback(async (planId: string, listing: Listing) => {
    if (!user) throw new Error('You must be logged in to add items to a plan');
    try {
      setError(null);
      await planService.addToPlan(user.id, planId, listing.id);
      setPlans(prev => prev.map(plan => plan.id === planId ? { ...plan, listings: [...plan.listings, listing.id] } : plan));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to plan');
      throw err;
    }
  }, [user]);

  const createPlan = useCallback(async (name: string, listing?: Listing, startDate?: string, endDate?: string) => {
    if (!user) throw new Error('You must be logged in to create a plan');
    try {
      setError(null);
      const newPlan = await planService.createPlan(user.id, name, listing?.id, startDate, endDate);
      setPlans(prev => [...prev, newPlan]);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    }
  }, [user]);

  const removeFromPlan = useCallback(async (planId: string, listingId: string) => {
    if (!user) throw new Error('You must be logged in to remove items from a plan');
    try {
      setError(null);
      await planService.removeFromPlan(user.id, planId, listingId);
      setPlans(prev => prev.map(plan => plan.id === planId ? { ...plan, listings: plan.listings.filter(id => id !== listingId) } : plan));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from plan');
      throw err;
    }
  }, [user]);

  const deletePlan = useCallback(async (planId: string) => {
    if (!user) throw new Error('You must be logged in to delete a plan');
    try {
      setError(null);
      await planService.deletePlan(user.id, planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      throw err;
    }
  }, [user]);

  const refreshPlans = useCallback(async () => {
    await loadPlans();
  }, [loadPlans]);

  return (
    <PlanContext.Provider value={{
      plans,
      loading,
      error,
      addToPlan,
      createPlan,
      removeFromPlan,
      deletePlan,
      refreshPlans
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
