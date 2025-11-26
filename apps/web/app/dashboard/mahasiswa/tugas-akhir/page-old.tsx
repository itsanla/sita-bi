'use client';

import { useEffect, useState, useMemo } from 'react';
import request from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  CheckCircle,
  Clock,
  Search,
  BookMarked,
  Trash2,
  PlusCircle,
} from 'lucide-react';

// --- Interfaces ---
interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  peranDosenTa: { peran: string; dosen: { user: { name: string } } }[];
}

interface TawaranTopik {
  id: number;
  judul_topik: string;
  deskripsi: string;
  kuota: number;
  dosenPencetus: {
    name: string;
  };
}

// --- Helper to get status color ---
const getStatusChip = (status: string) => {
  switch (status) {
    case 'DISETUJUI':
    case 'SELESAI':
    case 'BIMBINGAN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
          {status}
        </span>
      );
    case 'DIAJUKAN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="-ml-0.5 mr-1.5 h-4 w-4" />
          {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {status}
        </span>
      );
  }
};

// --- Main Page Component ---
export default function TugasAkhirPage() {
  const { user } = useAuth();
  const [tugasAkhir, setTugasAkhir] = useState<TugasAkhir | null>(null);
  const [allTitles, setAllTitles] = useState<{ judul: string }[]>([]);
  const [recommendedTitles, setRecommendedTitles] = useState<TawaranTopik[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [judulMandiri, setJudulMandiri] = useState('');

  // State for similarity check
  const [similarityResults, setSimilarityResults] = useState<Array<{
    id: number;
    judul: string;
    similarity: number;
  }> | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // State for submitted titles table
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State for recommended titles table
  const [recSearchTerm, setRecSearchTerm] = useState('');
  const [recCurrentPage, setRecCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const taResponse = await request<{ data: TugasAkhir | null }>(
        '/tugas-akhir/my-ta',
      );
      setTugasAkhir(taResponse.data.data);
    } catch (err: unknown) {
      if (
        (err as { response?: { status?: number } }).response?.status !== 404
      ) {
        setError((err as Error).message || 'Failed to fetch data');
      }
      setTugasAkhir(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTitles = async () => {
    try {
      const response = await request<{ data: { judul: string }[] }>(
        '/tugas-akhir/all-titles',
      );
      if (Array.isArray(response.data)) {
        if (Array.isArray(response.data)) {
          setAllTitles(response.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch all titles:', err);
    }
  };

  const fetchRecommendedTitles = async () => {
    try {
      const response = await request<{ data: { data: TawaranTopik[] } }>(
        '/tawaran-topik/available',
      );
      if (Array.isArray(response.data?.data)) {
        setRecommendedTitles(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recommended titles:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchAllTitles();
      fetchRecommendedTitles();
    }
  }, [user]);

  const handleCheckSimilarity = async (titleToCheck: string) => {
    if (!titleToCheck) {
      alert('Please enter a title first.');
      return;
    }
    setIsChecking(true);
    setSimilarityResults(null);
    setIsBlocked(false);
    try {
      const response = await request<{
        data: {
          results: Array<{ id: number; judul: string; similarity: number }>;
          isBlocked: boolean;
        };
      }>('/tugas-akhir/check-similarity', {
        method: 'POST',
        data: { judul: titleToCheck },
      });
      setSimilarityResults(response.data?.data?.results || []);
      setIsBlocked(response.data?.data?.isBlocked || false);
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!confirm('Are you sure you want to submit this title?')) return;
    try {
      await request('/tugas-akhir', {
        method: 'POST',
        data: { judul: judulMandiri },
      });
      alert('Successfully submitted title for approval.');
      setSimilarityResults(null);
      fetchData();
      fetchAllTitles();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleAmbilJudul = (judul: string) => {
    setJudulMandiri(judul);
    handleCheckSimilarity(judul);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this submission? This action cannot be undone.',
      )
    ) {
      return;
    }
    try {
      await request('/tugas-akhir/my-ta', { method: 'DELETE' });
      alert('Submission successfully deleted.');
      fetchData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  // --- Logic for Submitted Titles Table ---
  const filteredTitles = useMemo(
    () =>
      allTitles.filter((ta) =>
        ta.judul.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [allTitles, searchTerm],
  );
  const totalPages = Math.ceil(filteredTitles.length / itemsPerPage);
  const paginatedTitles = useMemo(
    () =>
      filteredTitles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filteredTitles, currentPage, itemsPerPage],
  );
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Logic for Recommended Titles Table ---
  const filteredRecTitles = useMemo(
    () =>
      recommendedTitles.filter((ta) =>
        ta.judul_topik.toLowerCase().includes(recSearchTerm.toLowerCase()),
      ),
    [recommendedTitles, recSearchTerm],
  );
  const recTotalPages = Math.ceil(filteredRecTitles.length / itemsPerPage);
  const paginatedRecTitles = useMemo(
    () =>
      filteredRecTitles.slice(
        (recCurrentPage - 1) * itemsPerPage,
        recCurrentPage * itemsPerPage,
      ),
    [filteredRecTitles, recCurrentPage, itemsPerPage],
  );
  const handleRecPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= recTotalPages) {
      setRecCurrentPage(newPage);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;

  // --- Render Logic ---
  if (tugasAkhir) {
    // --- UI when TA exists ---
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          My Final Project
        </h1>
        <div className="flex items-center gap-4 mb-6">
          <p className="text-gray-600">Status:</p>
          {getStatusChip(tugasAkhir.status)}
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Title</h2>
            <p className="text-lg text-gray-900">{tugasAkhir.judul}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Supervisors</h3>
            <ul className="mt-2 space-y-2">
              {tugasAkhir.peranDosenTa?.length > 0 ? (
                tugasAkhir.peranDosenTa.map((p) => (
                  <li
                    key={p.peran}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <span className="font-semibold capitalize w-28">
                      {p.peran}:
                    </span>
                    <span>{p.dosen.user.name}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">
                  No supervisors assigned yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        {(tugasAkhir.status === 'DIAJUKAN' ||
          tugasAkhir.status === 'DITOLAK') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={16} />
              Cancel & Delete Submission
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete your submission and allow you to
              propose a new title.
            </p>
          </div>
        )}
      </div>
    );
  } else {
    // --- UI when no TA exists ---
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Propose Final Project Title
          </h1>
          <p className="mt-2 text-gray-600">
            You do not have an active final project. Propose your title below
            for approval.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* --- Form Section --- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckSimilarity(judulMandiri);
            }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              Propose Your Title
            </h2>
            <div>
              <label
                htmlFor="judulMandiri"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Final Project Title
              </label>
              <input
                id="judulMandiri"
                type="text"
                value={judulMandiri}
                onChange={(e) => {
                  setJudulMandiri(e.target.value);
                  setSimilarityResults(null);
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
                placeholder="Enter your proposed title"
              />
            </div>
            <button
              type="submit"
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-red-800 text-white font-semibold rounded-lg hover:bg-red-900 transition-colors shadow-sm disabled:bg-gray-400"
            >
              {isChecking ? 'Checking...' : 'Check Similarity'}
            </button>
          </form>

          {/* --- Similarity Results Section --- */}
          {!!similarityResults && (
            <div className="mt-6 space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800">
                Similarity Check Results
              </h3>
              {similarityResults.length > 0 ? (
                <ul className="space-y-2">
                  {similarityResults.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 bg-gray-50 rounded-md border"
                    >
                      <p className="font-semibold text-gray-800">
                        {item.judul}
                      </p>
                      <p className="text-sm text-red-700 font-medium">
                        {item.similarity}% similar
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  No significant similarity found. You can proceed.
                </p>
              )}

              {!!isBlocked && (
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p className="font-bold">Submission Blocked</p>
                  <p>
                    Your title has a similarity score of 80% or higher with an
                    existing title. Please revise your title.
                  </p>
                </div>
              )}

              <button
                onClick={handleFinalSubmit}
                disabled={isBlocked}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
              >
                Yakin Gunakan Judul Ini
              </button>
            </div>
          )}

          <hr />

          {/* --- Submitted Titles Table Section --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Previously Submitted Titles
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
              />
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTitles.length > 0 ? (
                    paginatedTitles.map((ta, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-800">
                          {ta.judul}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        No titles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <hr />

          {/* --- Recommended Titles Table Section --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookMarked size={20} /> Recommended Titles from Lecturers
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recommended titles..."
                value={recSearchTerm}
                onChange={(e) => {
                  setRecSearchTerm(e.target.value);
                  setRecCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800"
              />
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Lecturer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      Ambil
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecTitles.length > 0 ? (
                    paginatedRecTitles.map((ta) => (
                      <tr key={ta.id}>
                        <td className="px-6 py-4 whitespace-normal text-sm font-semibold text-gray-800">
                          {ta.judul_topik}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-600">
                          {ta.deskripsi}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {ta.dosenPencetus.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => handleAmbilJudul(ta.judul_topik)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors"
                          >
                            <PlusCircle size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No recommended titles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {recTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => handleRecPageChange(recCurrentPage - 1)}
                  disabled={recCurrentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {recCurrentPage} of {recTotalPages}
                </span>
                <button
                  onClick={() => handleRecPageChange(recCurrentPage + 1)}
                  disabled={recCurrentPage === recTotalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
