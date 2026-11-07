// src/pages/client/documents/Documents.jsx
// Client Portal - Shared Documents & Files
// Displays deliverables, contracts, specifications, and invoices shared with this client.

import { useState, useEffect, useCallback } from 'react';
import { getDocuments, getFileUrl } from '../../../api/documents';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import {
  FileText,
  Download,
  Search,
  Calendar,
  FolderOpen,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

export default function ClientDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocuments();
      const dData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setDocuments(dData);
    } catch (err) {
      console.error('Failed to load client documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filteredDocs = documents.filter((doc) => {
    const cat = (doc.category_display || doc.category || '').toLowerCase();
    const title = (doc.title || '').toLowerCase();
    const proj = (doc.project_title || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return !q || title.includes(q) || cat.includes(q) || proj.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared Documents"
        subtitle="Access and download project specifications, signed contracts, and deliverables shared with your company."
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name, category, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filteredDocs.length} Documents Available
        </span>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <FileText className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Documents Shared Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No documents matched "${searchQuery}".`
              : 'Files and project deliverables shared by your agency will appear here for download.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const rawUrl = doc.file_url || doc.file;
            const downloadUrl = getFileUrl(rawUrl);

            return (
              <Card
                key={doc.id}
                className="p-5 flex flex-col justify-between hover:border-blue-300 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileCheck size={20} />
                    </div>
                    {doc.version && (
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        v{doc.version}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">
                    {doc.title}
                  </h3>

                  {(doc.category_display || doc.category) && (
                    <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-3">
                      {doc.category_display || doc.category}
                    </span>
                  )}

                  <div className="space-y-1 text-xs text-slate-400">
                    {doc.project_title && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <FolderOpen size={12} className="text-slate-400" />
                        <span className="truncate">{doc.project_title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Shared
                  </span>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Download size={13} /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No file attached</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
