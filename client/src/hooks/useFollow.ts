import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import * as followerService from '../services/followerService';
import { FollowRelationStatus, FollowCountsResponse } from '../types';

const DEFAULT_COUNTS: FollowCountsResponse = { followers: 0, following: 0 };

export function useFollow(userId: string, session: Session | null) {
  const [iFollow, setIFollow] = useState<FollowRelationStatus>('none');
  const [followsMe, setFollowsMe] = useState<FollowRelationStatus>('none');
  const [counts, setCounts] = useState<FollowCountsResponse>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myId = session?.user.id ?? null;
  const token = session?.access_token ?? null;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countsData, statusData] = await Promise.all([
        followerService.getFollowCounts(userId),
        token ? followerService.getStatus(userId, token) : null,
      ]);
      if (countsData) setCounts(countsData);
      if (statusData) {
        setIFollow(statusData.iFollow);
        setFollowsMe(statusData.followsMe);
      }
    } catch {
      setError('Error al cargar estado de seguimiento');
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (userId && myId !== userId) {
      refetch();
    } else {
      setLoading(false);
    }
  }, [userId, myId, refetch]);

  const follow = useCallback(async () => {
    if (!token) return;
    const prev = iFollow;
    const prevCounts = counts;
    setIFollow('pending');
    const res = await followerService.follow(userId, token);
    if (res) {
      setIFollow(res.status);
      if (res.status === 'accepted') {
        setCounts(c => ({ ...c, followers: c.followers + 1 }));
      }
    } else {
      setIFollow(prev);
      setCounts(prevCounts);
    }
  }, [userId, token, iFollow, counts]);

  const unfollow = useCallback(async () => {
    if (!token) return;
    const prev = iFollow;
    const prevCounts = counts;
    setIFollow('none');
    if (prev === 'accepted') {
      setCounts(c => ({ ...c, followers: Math.max(0, c.followers - 1) }));
    }
    const res = await followerService.unfollow(userId, token);
    if (!res) {
      setIFollow(prev);
      setCounts(prevCounts);
    }
  }, [userId, token, iFollow, counts]);

  const accept = useCallback(async () => {
    if (!token) return;
    const res = await followerService.acceptRequest(userId, token);
    if (res) refetch();
  }, [userId, token, refetch]);

  const reject = useCallback(async () => {
    if (!token) return;
    const res = await followerService.rejectRequest(userId, token);
    if (res) refetch();
  }, [userId, token, refetch]);

  return { iFollow, followsMe, counts, follow, unfollow, accept, reject, refetch, loading, error };
}
