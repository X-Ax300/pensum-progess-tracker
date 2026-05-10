import { collection, getDocs, type Firestore } from 'firebase/firestore';

export interface PensumCatalogEntry {
  id: string;
  institution: string;
  career: string;
}

export function normalizeLookupValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function createPensumDocId(institution: string, career: string) {
  const institutionKey = normalizeLookupValue(institution).replace(/\s+/g, '-');
  const careerKey = normalizeLookupValue(career).replace(/\s+/g, '-');
  return `${institutionKey}__${careerKey}`;
}

export async function getPensumCatalog(db: Firestore): Promise<PensumCatalogEntry[]> {
  const snapshot = await getDocs(collection(db, 'pensum'));

  return snapshot.docs
    .map((pensumDoc) => {
      const data = pensumDoc.data() as Record<string, unknown>;
      const institution = typeof data.institution === 'string' ? data.institution.trim() : '';
      const career = typeof data.careerName === 'string'
        ? data.careerName.trim()
        : typeof data.career === 'string'
          ? data.career.trim()
          : '';

      return {
        id: pensumDoc.id,
        institution,
        career,
      };
    })
    .filter((entry) => entry.institution && entry.career);
}

export async function resolvePensumDocId(
  db: Firestore,
  institution: string,
  career: string
): Promise<string | null> {
  const normalizedInstitution = normalizeLookupValue(institution);
  const normalizedCareer = normalizeLookupValue(career);

  if (!normalizedInstitution || !normalizedCareer) {
    return null;
  }

  const catalog = await getPensumCatalog(db);
  const match = catalog.find((entry) =>
    normalizeLookupValue(entry.institution) === normalizedInstitution &&
    normalizeLookupValue(entry.career) === normalizedCareer
  );

  return match?.id ?? null;
}
