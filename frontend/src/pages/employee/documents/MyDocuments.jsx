// src/pages/employee/documents/MyDocuments.jsx
// Employee / Staff - Project Documents & Deliverables
// Staff can upload deliverables, download contract specs, and manage files.

import { useState, useEffect, useCallback } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../../../api/documents';
import { getProjects } from '../../../api/projects';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Calendar,
  FolderOpen,
  FileCheck,
} from 'lucide-react';

export default function MyDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Deliverable',
    project: '',
    version: '1.0',
    is_shared_with_client: true,
    file: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, projRes] = await Promise.allSettled([
        getDocuments(),
        getProjects(),
      ]);

      if (docsRes.status === 'fulfilled') {
        const dData = Array.isArray(docsRes.value.data)
          ? docsRes.value.data
          : docsRes.value.data?.results || [];
        setDocuments(dData);
      }

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    if (!formData.file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      data.append('version', formData.version);
      data.append('is_shared_with_client', formData.is_shared_with_client);
      data.append('file', formData.file);
      if (formData.project) {
        data.append('project', formData.project);
      }

      await uploadDocument(data);
      toast.success('Document uploaded successfully!');
      setUploadModalOpen(false);
      setFormData({
        title: '',
        category: 'Deliverable',
        project: '',
        version: '1.0',
        is_shared_with_client: true,
        file: null,
      });
      fetchData();
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    return (
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.project_title && doc.project_title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Documents"
        subtitle="Manage deliverable assets, upload project files, and share files with clients."
        action={
          <Button
            variant="primary"
            icon={Upload}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filteredDocs.length} Total Documents
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
          <h3 className="text-base font-semibold text-slate-700">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No documents match "${searchQuery}".`
              : 'There are no documents uploaded for your projects yet.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const downloadUrl = doc.file_url || doc.file;

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

                  {doc.category && (
                    <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-3">
                      {doc.category}
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
                  <span
                    className={`text-[11px] font-medium ${
                      doc.is_shared_with_client
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {doc.is_shared_with_client ? 'Shared with client' : 'Internal only'}
                  </span>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Project Document"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Architecture Blueprint v1.0"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Deliverable">Deliverable</option>
                <option value="Specification">Specification</option>
                <option value="Contract">Contract</option>
                <option value="Invoice">Invoice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Project
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Project Link</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shareClient"
              checked={formData.is_shared_with_client}
              onChange={(e) => setFormData({ ...formData, is_shared_with_client: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="shareClient" className="text-xs text-slate-700 font-medium">
              Share with client in their portal
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className="!bg-[#121358]"
            >
              Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
