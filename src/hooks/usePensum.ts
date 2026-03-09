import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Subject, Prerequisite, UserProgress, SubjectWithProgress, ProgressStats, UserProfile } from '../types';

export function usePensum() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const unsub = auth.onAuthStateChanged(() => {
      loadData();
    });
    return unsub;
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      let profileData: UserProfile | null = null;

      if (user) {
        // Cargar perfil del usuario
        const profileDoc = await getDocs(query(
          collection(db, 'userProfiles'),
          where('userId', '==', user.uid)
        ));
        if (!profileDoc.empty) {
          profileData = {
            id: profileDoc.docs[0].id,
            ...profileDoc.docs[0].data(),
          } as UserProfile;
        }
        setUserProfile(profileData);
      }

      // Cargar subjects y prerequisites por carrera
      if (profileData?.career) {
        const [subjectsSnapshot, prerequisitesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'subjects'), where('career', '==', profileData.career))),
          getDocs(query(collection(db, 'prerequisites'), where('career', '==', profileData.career)))
        ]);

        const subjectsData = subjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Subject)).sort((a, b) => a.semester - b.semester);

        const prerequisitesData = prerequisitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Prerequisite));

        setSubjects(subjectsData);
        setPrerequisites(prerequisitesData);
      } else {
        setSubjects([]);
        setPrerequisites([]);
      }

      // Cargar progreso del usuario
      if (user) {
        const userProgressQuery = query(
          collection(db, 'user_progress'),
          where('userId', '==', user.uid)
        );
        const progressSnapshot = await getDocs(userProgressQuery);
        const progressData = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as UserProgress));

        setUserProgress(progressData);
        setCurrentUid(user.uid);
      } else {
        setUserProgress([]);
        setCurrentUid(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading pensum data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Optimized user progress loading
  const loadUserProgress = useCallback(async (force = false) => {
    const user = auth.currentUser;

    if (!user) {
      setUserProgress([]);
      setCurrentUid(null);
      return;
    }

    const userProgressQuery = query(
      collection(db, 'user_progress'),
      where('userId', '==', user.uid)
    );
    const progressSnapshot = await getDocs(userProgressQuery);
    const progressData = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as UserProgress));

    setUserProgress(progressData);
    setCurrentUid(user.uid);
  }, []);

  // Optimized subject status update with batch operations
  const updateSubjectStatus = useCallback(async (
    subjectCode: string,
    status: 'pending' | 'in_progress' | 'completed'
  ) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const existingProgress = userProgress.find(p => p.subjectCode === subjectCode);
    const batch = writeBatch(db);

    if (existingProgress) {
      // Update existing progress
      const progressRef = doc(db, 'user_progress', existingProgress.id);
      batch.update(progressRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Update local state optimistically
      setUserProgress(prev =>
        prev.map(p =>
          p.id === existingProgress.id
            ? { ...p, status, updatedAt: new Date().toISOString() }
            : p
        )
      );
    } else {
      // Create new progress record
      const newProgressRef = doc(collection(db, 'user_progress'));
      const newProgress = {
        userId: user.uid,
        subjectCode,
        status,
        isValidated: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(newProgressRef, newProgress);

      // Update local state optimistically
      setUserProgress(prev => [
        ...prev,
        {
          id: newProgressRef.id,
          ...newProgress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as UserProgress,
      ]);
    }

    // Execute batch operation
    await batch.commit();
  }, [userProgress]);

  // Optimized validated status update
  const updateValidatedStatus = useCallback(async (subjectCode: string, isValidated: boolean) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const existingProgress = userProgress.find(p => p.subjectCode === subjectCode);
    const batch = writeBatch(db);

    if (existingProgress) {
      const progressRef = doc(db, 'user_progress', existingProgress.id);
      batch.update(progressRef, {
        isValidated,
        status: isValidated ? 'completed' : existingProgress.status,
        updatedAt: serverTimestamp(),
      });

      // Update local state optimistically
      setUserProgress(prev =>
        prev.map(p =>
          p.id === existingProgress.id
            ? {
                ...p,
                isValidated,
                status: isValidated ? 'completed' : p.status,
                updatedAt: new Date().toISOString()
              }
            : p
        )
      );
    } else if (isValidated) {
      // Create new validated progress record
      const newProgressRef = doc(collection(db, 'user_progress'));
      const newProgress = {
        userId: user.uid,
        subjectCode,
        status: 'completed',
        isValidated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(newProgressRef, newProgress);

      // Update local state optimistically
      setUserProgress(prev => [
        ...prev,
        {
          id: newProgressRef.id,
          ...newProgress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as UserProgress,
      ]);
    }

    await batch.commit();
  }, [userProgress]);

  // Memoized expensive calculations
  const subjectsWithProgress = useMemo((): SubjectWithProgress[] => {
    // Create a map for faster prerequisite lookups
    const progressMap = new Map(userProgress.map(p => [p.subjectCode, p]));
    const prereqMap = new Map<string, string[]>();

    // Pre-compute prerequisites for each subject
    prerequisites.forEach(p => {
      if (!prereqMap.has(p.subjectCode)) {
        prereqMap.set(p.subjectCode, []);
      }
      prereqMap.get(p.subjectCode)!.push(p.prerequisiteCode);
    });

    return subjects.map(subject => {
      const progress = progressMap.get(subject.code);
      const status = progress?.status || 'pending';
      const isValidated = progress?.isValidated || false;

      const subjectPrereqs = prereqMap.get(subject.code) || [];

      const isLocked = subjectPrereqs.some(prereqCode => {
        const prereqProgress = progressMap.get(prereqCode);
        return !prereqProgress?.status || prereqProgress.status !== 'completed';
      });

      return {
        ...subject,
        status,
        prerequisites: subjectPrereqs,
        isLocked,
        isValidated,
      };
    });
  }, [subjects, prerequisites, userProgress]);

  const stats = useMemo((): ProgressStats => {
    // Create maps for faster lookups
    const progressMap = new Map(userProgress.map(p => [p.subjectCode, p]));
    const subjectMap = new Map(subjects.map(s => [s.code, s]));

    let completedSubjects = 0;
    let inProgressSubjects = 0;
    let pendingSubjects = 0;
    let completedCredits = 0;
    let inProgressCredits = 0;

    // Single pass through subjectsWithProgress
    subjectsWithProgress.forEach(subject => {
      const progress = progressMap.get(subject.code);
      const status = progress?.status || 'pending';

      switch (status) {
        case 'completed':
          completedSubjects++;
          completedCredits += subject.credits;
          break;
        case 'in_progress':
          inProgressSubjects++;
          inProgressCredits += subject.credits;
          break;
        default:
          pendingSubjects++;
      }
    });

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const pendingCredits = totalCredits - completedCredits - inProgressCredits;

    const progressPercentage = totalCredits > 0 ? Math.round((completedCredits / totalCredits) * 100) : 0;

    const averageCreditsPerSemester = 15;
    const remainingCredits = totalCredits - completedCredits;
    const estimatedSemestersRemaining = Math.ceil(remainingCredits / averageCreditsPerSemester);

    return {
      totalSubjects: subjects.length,
      completedSubjects,
      inProgressSubjects,
      pendingSubjects,
      totalCredits,
      completedCredits,
      inProgressCredits,
      pendingCredits,
      progressPercentage,
      estimatedSemestersRemaining,
    };
  }, [subjectsWithProgress, subjects, userProgress]);

  // Wrapper functions for compatibility
  const getSubjectsWithProgress = useCallback(() => subjectsWithProgress, [subjectsWithProgress]);
  const calculateStats = useCallback(() => stats, [stats]);

  // Simple refresh function that reloads all data fresh from Firestore
  const refreshData = useCallback(async (forceAll = false) => {
    await loadData();
  }, []);

  return {
    subjects,
    prerequisites,
    userProgress,
    userProfile,
    loading,
    error,
    updateSubjectStatus,
    updateValidatedStatus,
    getSubjectsWithProgress,
    calculateStats,
    refreshData,
  };
}
