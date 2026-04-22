// src/components/UploadPensum.tsx
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
// we only need getDocument; import path has no types so ignore TS
// setup worker for pdfjs to avoid runtime error
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// build a URL for the worker file from the installed package
// Vite handles `?url` suffix to return a public path string
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;
import { Upload, FileText, CheckCircle, AlertCircle, Lock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';

interface ParsedSubject {
  code: string;
  name: string;
  credits: number;
  semester: number;
  prereqs: string[];
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

interface PdfRow {
  y: number;
  items: PdfTextItem[];
  text: string;
}

type SectionLayout = 'standard' | 'plan' | 'software';

interface DraftSubject {
  code: string;
  name: string;
  credits: number;
  prereqs: string[];
  semester: number;
  rowIndex: number;
  hasInlineName: boolean;
}

const SUBJECT_CODE_REGEX = /^[A-ZÑ&-]+-\d{3}(?:-[A-Z])?$/;
const SUBJECT_CODE_MATCH_REGEX = /[A-ZÑ&-]+-\d{3}(?:-[A-Z])?/g;

interface UploadPensumProps {
  readonly onUpload?: (career: string) => Promise<void> | void;
  readonly userCareer?: string;
  readonly userInstitution?: string;
  readonly hasPensumLoaded?: boolean;
}

export function UploadPensum({
  onUpload,
  userCareer,
  userInstitution,
  hasPensumLoaded = false,
}: UploadPensumProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [career, setCareer] = useState(userCareer || '');
  const [pensumExists, setPensumExists] = useState(false);
  const [checkingPensum, setCheckingPensum] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setCareer(userCareer || '');
  }, [userCareer]);

  // Check if pensum already exists
  useEffect(() => {
    if (!career || !userInstitution) {
      setPensumExists(false);
      return;
    }

    const checkPensumExists = async () => {
      setCheckingPensum(true);
      try {
        const pensumDocId = `${userInstitution}_${career}`;
        const pensumRef = doc(db, 'pensum', pensumDocId);
        const pensumDoc = await getDoc(pensumRef);
        setPensumExists(pensumDoc.exists());
      } catch {
        setPensumExists(false);
      } finally {
        setCheckingPensum(false);
      }
    };

    checkPensumExists();
  }, [career]);

  // helpers --------------------------------------------------------------

  const extractRowsFromPdf = async (file: File): Promise<PdfRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const rows: PdfRow[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const pageItems = content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ({
          str: String(item.str || '').trim(),
          x: Number(item.transform?.[4] || 0),
          y: Number(item.transform?.[5] || 0),
        }))
        .filter(item => item.str);

      const pageRows: Array<{ y: number; items: PdfTextItem[] }> = [];
      pageItems.forEach(item => {
        const existingRow = pageRows.find(row => Math.abs(row.y - item.y) <= 3);
        if (existingRow) {
          existingRow.items.push(item);
        } else {
          pageRows.push({ y: item.y, items: [item] });
        }
      });

      pageRows
        .sort((a, b) => b.y - a.y)
        .forEach(row => {
          row.items.sort((a, b) => a.x - b.x);
          rows.push({
            y: row.y,
            items: row.items,
            text: row.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim(),
          });
        });
    }

    return rows;
  };

  const normalizeText = (value: string) =>
    value
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getSemesterNumber = (text: string) => {
    const normalized = normalizeText(text);
    const mappings: Array<[RegExp, number]> = [
      [/\bDECIMO SEXTO\b/, 16],
      [/\bDECIMO QUINTO\b/, 15],
      [/\bDECIMO CUARTO\b/, 14],
      [/\bDECIMO TERCER\b/, 13],
      [/\bDECIMO SEGUNDO\b/, 12],
      [/\bDECIMO PRIMER\b/, 11],
      [/\bUNDECIMO\b/, 11],
      [/\bDUODECIMO\b/, 12],
      [/\bDECIMO\b/, 10],
      [/\bPRIMER\b/, 1],
      [/\bSEGUNDO\b/, 2],
      [/\bTERCER\b/, 3],
      [/\bCUARTO\b/, 4],
      [/\bQUINTO\b/, 5],
      [/\bSEXTO\b/, 6],
      [/\bSEPTIMO\b/, 7],
      [/\bOCTAVO\b/, 8],
      [/\bNOVENO\b/, 9],
    ];

    for (const [pattern, value] of mappings) {
      if (pattern.test(normalized)) return value;
    }

    const numericMatch = normalized.match(/(\d{1,2})(?:MO|VO|ER)?\s+CUAT/);
    return numericMatch ? Number.parseInt(numericMatch[1], 10) : null;
  };

  const isSemesterHeader = (text: string) => {
    const normalized = normalizeText(text);
    return (
      normalized.includes('CUATRIMESTRE') ||
      normalized.includes('TRIMESTRE') ||
      normalized.includes('PERIODO CUATRIMESTRAL')
    );
  };

  const detectSectionLayout = (row: PdfRow): SectionLayout | null => {
    const normalized = normalizeText(row.text);
    if ((normalized.includes('HT') || normalized.includes('HP')) && normalized.includes('PRE REQ')) {
      return 'software';
    }
    if (normalized.includes('CODIGO') && normalized.includes('CREDITOS')) {
      return 'plan';
    }
    if (normalized.includes('CLAVE') && (normalized.includes('NOMBRE') || normalized.includes('ASIGNATURA'))) {
      return 'standard';
    }
    return null;
  };

  const isIgnorableRow = (row: PdfRow) => {
    const normalized = normalizeText(row.text);
    return (
      !row.text ||
      normalized.startsWith('CLAVE ') ||
      normalized.startsWith('CODIGO ') ||
      normalized.startsWith('SUBTOTAL') ||
      normalized.startsWith('TOTAL ') ||
      normalized.includes('HORAS DE PASANTIA') ||
      normalized.includes('SERVICIO SOCIAL') ||
      normalized.includes('BLOQUES DE OPTATIVAS') ||
      normalized.includes('REQUISITOS DE EGRESO') ||
      normalized.includes('GRADO ACADEMICO') ||
      normalized.includes('DURACION ') ||
      normalized.startsWith('OPTATIVAS ') ||
      normalized.startsWith('ELECTIVA') ||
      normalized.startsWith('OPTATIVA') ||
      normalized.startsWith('ESTE PLAN DE ESTUDIO') ||
      normalized.startsWith('EN ADICION ') ||
      normalized.startsWith('DE ACUERDO ') ||
      normalized.startsWith('* EL CORREQUISITO') ||
      normalized.includes('AUTOPISTA 30 DE MAYO') ||
      normalized.includes('WWW UNICARIBE EDU DO') ||
      normalized.includes('REPUBLICA DOMINICANA')
    );
  };

  const getRowCode = (row: PdfRow) =>
    row.items.find(item => SUBJECT_CODE_REGEX.test(item.str) && item.x < 130)?.str || null;

  const getRowName = (row: PdfRow, layout: SectionLayout) => {
    if (layout === 'software') {
      return row.items
        .filter(item => item.x >= 120 && item.x < 345)
        .map(item => item.str)
        .join(' ')
        .trim();
    }

    if (layout === 'plan') {
      return row.items
        .filter(item => item.x >= 80 && item.x < 170)
        .map(item => item.str)
        .join(' ')
        .trim();
    }

    return row.items
      .filter(item => item.x >= 120 && item.x < 455)
      .map(item => item.str)
      .join(' ')
      .trim();
  };

  const getRowCredits = (row: PdfRow, layout: SectionLayout) => {
    const numericItems = row.items.filter(item => /^\d+$/.test(item.str));

    if (layout === 'software') {
      return numericItems.find(item => item.x >= 440 && item.x < 470)?.str || '0';
    }

    if (layout === 'plan') {
      return numericItems.find(item => item.x >= 165 && item.x < 190)?.str || '0';
    }

    return numericItems.find(item => item.x >= 455 && item.x < 480)?.str || '0';
  };

  const getRowPrereqs = (row: PdfRow, layout: SectionLayout) => {
    const rawText = layout === 'software'
      ? row.items.filter(item => item.x >= 470).map(item => item.str).join(' ')
      : layout === 'plan'
        ? row.items.filter(item => item.x >= 190 && item.x < 255).map(item => item.str).join(' ')
        : row.items.filter(item => item.x >= 480).map(item => item.str).join(' ');

    return rawText.match(SUBJECT_CODE_MATCH_REGEX) || [];
  };

  const isLikelyNameContinuationRow = (row: PdfRow, layout: SectionLayout) => {
    if (row.items.length === 0) return false;

    if (layout === 'software') {
      return row.items.every(item => (item.x >= 120 && item.x < 345) || item.x >= 470);
    }

    if (layout === 'plan') {
      return row.items.every(item => (item.x >= 80 && item.x < 170) || item.x >= 190);
    }

    return row.items.every(item => item.x >= 120 && item.x < 455) && !/[a-z]/.test(row.text);
  };

  const parseSectionSubjects = (rows: PdfRow[], semester: number, layout: SectionLayout): ParsedSubject[] => {
    const draftSubjects: DraftSubject[] = [];

    rows.forEach((row, rowIndex) => {
      if (isIgnorableRow(row) || isSemesterHeader(row.text)) return;

      const code = getRowCode(row);
      if (!code) return;

      const name = getRowName(row, layout);
      draftSubjects.push({
        code,
        name,
        credits: Number.parseInt(getRowCredits(row, layout), 10) || 0,
        prereqs: getRowPrereqs(row, layout),
        semester,
        rowIndex,
        hasInlineName: Boolean(name),
      });
    });

    rows.forEach((row, rowIndex) => {
      if (isIgnorableRow(row) || isSemesterHeader(row.text) || getRowCode(row)) return;

      const extraName = getRowName(row, layout);
      const extraCredits = Number.parseInt(getRowCredits(row, layout), 10) || 0;
      const extraPrereqs = getRowPrereqs(row, layout);
      const normalizedExtraName = normalizeText(extraName);
      const hasNameContinuation = extraName && isLikelyNameContinuationRow(row, layout);
      if (!extraName && extraCredits === 0 && extraPrereqs.length === 0) {
        return;
      }

      const previous = [...draftSubjects].reverse().find(subject => subject.rowIndex < rowIndex);
      const next = draftSubjects.find(subject => subject.rowIndex > rowIndex);
      const target = hasNameContinuation && next && !next.hasInlineName ? next : previous;

      if (!target) return;

      if (
        hasNameContinuation &&
        !/^\d+$/.test(extraName) &&
        !normalizedExtraName.startsWith('ELECTIVA') &&
        !normalizedExtraName.startsWith('OPTATIVA')
      ) {
        target.name = target.hasInlineName
          ? `${target.name} ${extraName}`.replace(/\s+/g, ' ').trim()
          : `${extraName} ${target.name}`.replace(/\s+/g, ' ').trim();
        target.hasInlineName = true;
      }

      if (target.credits === 0 && extraCredits > 0) {
        target.credits = extraCredits;
      }

      if (extraPrereqs.length > 0 && !hasNameContinuation) {
        target.prereqs = Array.from(new Set([...target.prereqs, ...extraPrereqs]));
      }
    });

    return draftSubjects
      .filter(subject => subject.name)
      .map(({ code, name, credits, prereqs, semester: subjectSemester }) => ({
        code,
        name: name.replace(/\s+/g, ' ').trim(),
        credits,
        prereqs,
        semester: subjectSemester,
      }));
  };

  const parseSubjectsFromRows = (rows: PdfRow[]): ParsedSubject[] => {
    const sections: Array<{ semester: number; layout: SectionLayout; rows: PdfRow[] }> = [];
    let currentSemester = 0;
    let currentLayout: SectionLayout = 'standard';
    let currentRows: PdfRow[] = [];

    const flushSection = () => {
      if (currentSemester === 0 || currentRows.length === 0) return;
      sections.push({ semester: currentSemester, layout: currentLayout, rows: currentRows });
      currentRows = [];
    };

    rows.forEach(row => {
      const normalizedRow = normalizeText(row.text);
      if (
        normalizedRow.includes('BLOQUES DE OPTATIVAS') ||
        normalizedRow.includes('REQUISITOS DE EGRESO')
      ) {
        flushSection();
        currentSemester = 0;
        return;
      }

      if (normalizedRow.startsWith('SUBTOTAL')) {
        flushSection();
        return;
      }

      if (isSemesterHeader(row.text)) {
        const semester = getSemesterNumber(row.text);
        if (semester) {
          flushSection();
          currentSemester = semester;
        }
        return;
      }

      const layout = detectSectionLayout(row);
      if (layout) {
        currentLayout = layout;
        return;
      }

      if (currentSemester > 0) {
        currentRows.push(row);
      }
    });

    flushSection();

    const subjectsByCode = new Map<string, ParsedSubject>();
    sections.forEach(section => {
      parseSectionSubjects(section.rows, section.semester, section.layout).forEach(subject => {
        subjectsByCode.set(subject.code, subject);
      });
    });

    return Array.from(subjectsByCode.values())
      .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));
  };

  const saveSubjects = async (subjects: ParsedSubject[], career: string) => {
    if (!user || !userInstitution) throw new Error('Usuario no autenticado o institución no especificada');

    const pensumDocId = `${userInstitution}_${career}`;
    const pensumRef = doc(db, 'pensum', pensumDocId);
    
    // Crear documento de pensum con reintentos
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`Creando documento de pensum (intento ${retries + 1}/${maxRetries}): ${pensumDocId}`);
        await setDoc(pensumRef, {
          careerName: career,
          institution: userInstitution,
          uploadedBy: user.uid,
          uploadedAt: new Date(),
          totalSubjects: subjects.length,
          description: `Pensum de ${career} - ${userInstitution}`,
          createdAt: new Date(),
        });
        console.log('Documento de pensum creado exitosamente');
        break;
      } catch (err) {
        retries++;
        console.error(`Error creando documento de pensum (intento ${retries}):`, err);
        if (retries >= maxRetries) {
          throw new Error(`Error al crear pensum después de ${maxRetries} intentos: ${err instanceof Error ? err.message : 'desconocido'}`);
        }
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Pequeña pausa para asegurar que el documento se haya written
    await new Promise(resolve => setTimeout(resolve, 500));

    // Preparar todas las operaciones de escritura
    const writeOperations: Array<() => Promise<void>> = [];

    // Operaciones de materias (máximo 450 operaciones por batch para dejar espacio)
    const subjectsRef = collection(db, 'pensum', pensumDocId, 'subjects');
    const subjectBatches: Array<(batch: any) => void> = [];
    
    subjects.forEach((s) => {
      subjectBatches.push((batch) => {
        const docRef = doc(subjectsRef, s.code);
        batch.set(docRef, {
          code: s.code,
          name: s.name,
          credits: s.credits,
          semester: s.semester,
          career,
          isValidated: false,
          createdAt: new Date(),
        });
      });
    });

    // Operaciones de prerequisitos
    const prereqRef = collection(db, 'pensum', pensumDocId, 'prerequisites');
    const prereqBatches: Array<(batch: any) => void> = [];
    
    subjects.forEach((s) => {
      s.prereqs.forEach((dep) => {
        prereqBatches.push((batch) => {
          const docRef = doc(prereqRef, `${s.code}__${dep}`);
          batch.set(docRef, {
            subjectCode: s.code,
            prerequisiteCode: dep,
            career,
            institution: userInstitution,
            createdAt: new Date(),
          });
        });
      });
    });

    // Dividir en batches de máximo 450 operaciones
    const allOperations = [...subjectBatches, ...prereqBatches];
    const maxOpsPerBatch = 450;
    const totalBatches = Math.ceil(allOperations.length / maxOpsPerBatch);
    
    console.log(`Total de operaciones: ${allOperations.length}, divididas en ${totalBatches} batches`);
    
    for (let i = 0; i < allOperations.length; i += maxOpsPerBatch) {
      const batchOps = allOperations.slice(i, i + maxOpsPerBatch);
      const batchIndex = Math.floor(i / maxOpsPerBatch) + 1;
      
      writeOperations.push(async () => {
        let batchRetries = 0;
        const maxBatchRetries = 3;
        
        while (batchRetries < maxBatchRetries) {
          try {
            const batch = writeBatch(db);
            batchOps.forEach(op => op(batch));
            
            console.log(`Enviando batch ${batchIndex}/${totalBatches} (${batchOps.length} operaciones, intento ${batchRetries + 1}/${maxBatchRetries})`);
            await batch.commit();
            console.log(`Batch ${batchIndex} completado exitosamente`);
            break;
          } catch (err) {
            batchRetries++;
            console.error(`Error en batch ${batchIndex} (intento ${batchRetries}):`, err);
            if (batchRetries >= maxBatchRetries) {
              throw new Error(`Error al guardar batch ${batchIndex} después de ${maxBatchRetries} intentos: ${err instanceof Error ? err.message : 'desconocido'}`);
            }
            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1500 * batchRetries));
          }
        }
      });
    }

    // Ejecutar batches secuencialmente
    for (let i = 0; i < writeOperations.length; i++) {
      await writeOperations[i]();
      // Pequeña pausa entre batches para evitar problemas de conexión
      if (i < writeOperations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('Todos los datos guardados exitosamente');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setError('Por favor inicia sesión para cargar un pensum');
      return;
    }

    if (!userInstitution) {
      setError('No se encontró la institución en tu perfil. Por favor completa tu información de perfil.');
      return;
    }

    if (!career) {
      setError('Por favor selecciona una carrera');
      return;
    }

    if (hasPensumLoaded) {
      setError('Ya tienes un pensum cargado en tu cuenta. No puedes cargar otro.');
      return;
    }

    if (pensumExists) {
      setError('El pensum de esta carrera ya existe. No se puede sobreescribir.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const rows = await extractRowsFromPdf(file);
      console.log('Extracted rows:', rows.length);
      console.log('Sample rows:', rows.slice(0, 10).map(r => r.text));
      const subjects = parseSubjectsFromRows(rows);
      console.log('Parsed subjects:', subjects.length);
      if (subjects.length === 0) {
        console.log('No subjects found. All rows:', rows.map(r => r.text));
        throw new Error('No se pudieron encontrar materias en el PDF. Verifica que el formato sea correcto y que contenga códigos de materia (ej: ABC-123).');
      }
      console.log('Iniciando guardar de materias...');
      await saveSubjects(subjects, career);
      console.log('Materias guardadas exitosamente');
      setSuccessMessage(`${subjects.length} materias importadas para ${career}.`);
      if (onUpload) {
        // refresh parent data after import - only clear cache for this career
        await Promise.resolve(onUpload(career));
      }
      // Reset form
      setCareer('');
      setPensumExists(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error completo:', err);
      
      if (errorMessage.includes('Missing or insufficient permissions')) {
        setError('No tienes permiso para subir este pensum. Verifica las reglas de Firestore o que la carrera no exista ya.');
      } else if (errorMessage.includes('Error al guardar batch')) {
        setError(`${errorMessage} - Verifica tu conexión a internet y las permisos en Firestore.`);
      } else if (errorMessage.includes('PDF')) {
        setError(`Error leyendo PDF: ${errorMessage}`);
      } else {
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cargar Pensum desde PDF
          </h2>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 text-sm font-medium"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

      <div className="space-y-6">
        {/* Selección de Carrera */}
        <div>
          <label htmlFor="career-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Carrera del Pensum
          </label>
          <select
            id="career-select"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            disabled={Boolean(userCareer) || hasPensumLoaded}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
          >
            <option value="">Selecciona la carrera del pensum</option>
            <option value="Ingeniería de Software">Ingeniería de Software</option>
            <option value="Ingeniería de Datos">Ingeniería de Datos</option>
            <option value="Ingeniería en Ciberseguridad">Ingeniería en Ciberseguridad</option>
            <option value="Ciencias de la Computación">Ciencias de la Computación</option>
            <option value="Ingeniería Civil">Ingeniería Civil</option>
            <option value="Ingeniería Mecánica">Ingeniería Mecánica</option>
            <option value="Licenciatura en
Derecho">Licenciatura en
Derecho</option>
            <option value="Administración de Empresas">Administración de Empresas</option>
            <option value="Otra">Otra</option>
          </select>
          {userCareer && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              La carga usa la carrera de tu perfil: {userCareer}.
            </p>
          )}
        </div>

        {/* Upload Area */}
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Archivo PDF
          </label>
          {!user && (
            <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    No estás autenticado
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Por favor inicia sesión para cargar un pensum.
                  </p>
                </div>
              </div>
            </div>
          )}
          {!userInstitution && user && (
            <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Institución no definida
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Por favor completa tu perfil con la institución antes de cargar un pensum.
                  </p>
                </div>
              </div>
            </div>
          )}
          {hasPensumLoaded && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Ya tienes un pensum cargado
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Esta cuenta no puede subir otro pensum mientras ya tenga uno asociado.
                  </p>
                </div>
              </div>
            </div>
          )}
          {pensumExists && !checkingPensum && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Pensum de {career} ya existe
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    No se puede cargar otro PDF para esta carrera para evitar sobrecargar la base de datos.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            (pensumExists && !checkingPensum) || hasPensumLoaded || !user || !userInstitution
              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              disabled={loading || !career || pensumExists || checkingPensum || hasPensumLoaded || !user || !userInstitution}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className={`cursor-pointer ${
                loading || !career || pensumExists || checkingPensum || hasPensumLoaded ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {hasPensumLoaded
                      ? 'Carga bloqueada'
                      : checkingPensum
                        ? 'Verificando pensum...'
                        : loading
                          ? 'Procesando...'
                          : 'Haz clic para seleccionar PDF'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Solo archivos PDF • Máx. 10MB
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Analizando documento y extrayendo materias...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {successMessage && !loading && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {!loading && !error && !successMessage && career && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Listo para cargar
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Carrera: {career}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
