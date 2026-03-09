// src/components/UploadPensum.tsx
import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
// we only need getDocument; import path has no types so ignore TS
// setup worker for pdfjs to avoid runtime error
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// build a URL for the worker file from the installed package
// Vite handles `?url` suffix to return a public path string
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;
import { Upload, FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';

interface ParsedSubject {
  code: string;
  name: string;
  credits: number;
  semester: number;
  prereqs: string[];
}

interface UploadPensumProps {
  readonly onUpload?: (career: string) => Promise<void> | void;
}

export function UploadPensum({ onUpload }: UploadPensumProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [career, setCareer] = useState('');
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

  // Check if pensum already exists
  useEffect(() => {
    if (!career) {
      setPensumExists(false);
      return;
    }

    const checkPensumExists = async () => {
      setCheckingPensum(true);
      try {
        const pensumRef = doc(db, 'pensum', career);
        const pensumDoc = await getDoc(pensumRef);
        setPensumExists(pensumDoc.exists());
      } catch (err) {
        console.error('Error checking pensum:', err);
        setPensumExists(false);
      } finally {
        setCheckingPensum(false);
      }
    };

    checkPensumExists();
  }, [career]);

  // helpers --------------------------------------------------------------

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return text;
  };

  const parseSubjectsFromText = (text: string): ParsedSubject[] => {
    const markers = collectSemesterMarkers(text);
    const clean = text
      .replaceAll(/CLAVE\s+NOMBRE\s+CR\s+PRE-REQ\./g, '')
      .replaceAll(/(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|(?:SEPTIMO|SÉPTIMO)|OCTAVO|NOVENO|DÉCIMO|UNDÉCIMO|DUODÉCIMO)\s+CUATRIMESTRE/gi, '')
      .replaceAll(/INGENIERÍA\s+de\s+Software/gi, '');
    return buildSubjectsFromClean(clean, markers);
  };

  const collectSemesterMarkers = (text: string) => {
    const markerRegex = /(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|(?:SEPTIMO|SÉPTIMO)|OCTAVO|NOVENO|DÉCIMO|UNDÉCIMO|DUODÉCIMO)\s+CUATRIMESTRE/gi;
    const semesterMap: Record<string, number> = {
      PRIMER: 1,
      SEGUNDO: 2,
      TERCER: 3,
      CUARTO: 4,
      QUINTO: 5,
      SEXTO: 6,
      SEPTIMO: 7,
      SÉPTIMO: 7,
      OCTAVO: 8,
      NOVENO: 9,
      DÉCIMO: 10,
      UNDÉCIMO: 11,
      DUODÉCIMO: 12,
    };

    const markers: Array<{ pos: number; semester: number }> = [];
    let m;
    while ((m = markerRegex.exec(text)) !== null) {
      const ord = m[1].toUpperCase().replace('É', 'E');
      markers.push({ pos: m.index, semester: semesterMap[ord] || 0 });
    }
    return markers;
  };

  const buildSubjectsFromClean = (
    clean: string,
    markers: Array<{ pos: number; semester: number }>
  ): ParsedSubject[] => {
    const tokens = clean
      .split(/\s{2,}/g)
      .map((t: string) => t.trim())
      .filter(Boolean);

    const subjects: ParsedSubject[] = [];
    let lastSearchIdx = 0;

    for (let i = 0; i < tokens.length; ) {
      const code = tokens[i];
      if (/^[A-ZÑ&-]+-\d{3}$/.test(code)) {
        const name = tokens[i + 1] || '';
        const credits = Number.parseInt(tokens[i + 2] || '0', 10);
        const prereqRaw = tokens[i + 3] || '';
        const prereqs = prereqRaw.match(/[A-ZÑ&-]+-\d{3}/g) || [];

        const pos = clean.indexOf(code, lastSearchIdx);
        if (pos !== -1) lastSearchIdx = pos + code.length;

        let semester = 0;
        for (const mk of markers) {
          if (mk.pos <= pos) semester = mk.semester;
          else break;
        }

        subjects.push({ code, name, credits, semester, prereqs });
        i += 4;
      } else {
        i++;
      }
    }

    return subjects;
  };

  const saveSubjects = async (subjects: ParsedSubject[], career: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const batch = writeBatch(db);

    // Create pensum metadata document
    const pensumRef = doc(db, 'pensum', career);
    batch.set(pensumRef, {
      careerName: career,
      uploadedBy: user.uid,
      uploadedAt: new Date(),
      totalSubjects: subjects.length,
      description: `Pensum de ${career}`,
      createdAt: new Date(),
    });

    // Add subjects to subcollection
    const subjectsRef = collection(db, 'pensum', career, 'subjects');
    for (const s of subjects) {
      const docRef = doc(subjectsRef);
      batch.set(docRef, {
        code: s.code,
        name: s.name,
        credits: s.credits,
        semester: s.semester,
        career,
        isValidated: false,
        createdAt: new Date(),
      });
    }

    // Add prerequisites to subcollection
    const prereqRef = collection(db, 'pensum', career, 'prerequisites');
    for (const s of subjects) {
      for (const dep of s.prereqs) {
        const docRef = doc(prereqRef);
        batch.set(docRef, {
          subjectCode: s.code,
          prerequisiteCode: dep,
          career,
          createdAt: new Date(),
        });
      }
    }

    // Commit batch
    await batch.commit();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!career) {
      setError('Por favor selecciona una carrera');
      return;
    }

    if (pensumExists) {
      setError('El pensum de esta carrera ya existe. No se puede sobreescribir.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await extractTextFromPdf(file);
      const subjects = parseSubjectsFromText(text);
      await saveSubjects(subjects, career);
      alert(`${subjects.length} materias importadas para ${career}`);
      if (onUpload) {
        // refresh parent data after import - only clear cache for this career
        await Promise.resolve(onUpload(career));
      }
      // Reset form
      setCareer('');
      setPensumExists(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo leer el PDF o guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
          <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Cargar Pensum desde PDF
        </h2>
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
          >
            <option value="">Selecciona la carrera del pensum</option>
            <option value="Ingeniería de Software">Ingeniería de Software</option>
            <option value="Ingeniería de Datos">Ingeniería de Datos</option>
            <option value="Ingeniería en Ciberseguridad">Ingeniería en Ciberseguridad</option>
            <option value="Ciencias de la Computación">Ciencias de la Computación</option>
            <option value="Ingeniería Civil">Ingeniería Civil</option>
            <option value="Ingeniería Mecánica">Ingeniería Mecánica</option>
            <option value="Ingeniería Eléctrica">Ingeniería Eléctrica</option>
            <option value="Administración de Empresas">Administración de Empresas</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        {/* Upload Area */}
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Archivo PDF
          </label>
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
            pensumExists && !checkingPensum
              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              disabled={loading || !career || pensumExists || checkingPensum}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className={`cursor-pointer ${
                loading || !career || pensumExists || checkingPensum ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {checkingPensum ? 'Verificando pensum...' : loading ? 'Procesando...' : 'Haz clic para seleccionar PDF'}
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

        {/* Success Message */}
        {!loading && !error && career && (
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