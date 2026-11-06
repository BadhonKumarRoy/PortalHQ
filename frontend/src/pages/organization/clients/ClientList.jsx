// src/pages/organization/clients/ClientList.jsx
// Shows all clients in a searchable table with options to Add, View, Edit, and Delete.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { getClients, deleteClient } from '../../../api/clients';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });
  const [deleting, setDeleting] = useState(false);

  // Load clients from the API
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClients();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setClients(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Filter clients as the user types in the search box
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      clients.filter(
        (c) =>
          c.company_name?.toLowerCase().includes(q) ||
          c.contact_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    );
  }, [search, clients]);

  // Handle the delete confirmation
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClient(deleteModal.client.id);
      toast.success('Client deleted.');
      setDeleteModal({ open: false, client: null });
      fetchClients();
    } catch {
      toast.error('Failed to delete client.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'email', label: 'Email' },
    { key: 'industry', label: 'Industry' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/organization/clients/${row.id}`); }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/organization/clients/${row.id}/edit`); }}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, client: row }); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} total clients`}
        action={
          <Button icon={Plus} onClick={() => navigate('/organization/clients/new')}>
            Add Client
          </Button>
        }
      />

      <Card>
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-4 w-full sm:w-72">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="bg-transparent text-sm text-slate-700 outline-none w-full placeholder-slate-400"
          />
        </div>

        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No clients found. Add your first client!"
          onRowClick={(row) => navigate(`/organization/clients/${row.id}`)}
        />
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        title="Delete Client"
        size="sm"
      >
        <p className="text-slate-600 text-sm mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteModal.client?.company_name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, client: null })}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
