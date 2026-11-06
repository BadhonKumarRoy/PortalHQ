// src/pages/organization/projects/ProjectCreate.jsx
// Form page for creating a new project. Links to a client and assigned employees.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../../api/projects';
import { getClients } from '../../../api/clients';
import { getUsers } from '../../../api/auth';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ProjectCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    client: '',
    status: 'PLANNED',
    start_date: '',
    end_date: '',
    budget: '',
  });

  // Load clients and employees for the dropdowns
  useEffect(() => {
    getClients().then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setClients(data.map((c) => ({ value: c.id, label: c.company_name })));
    }).catch(() => {});

    getUsers().then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setEmployees(data.filter(u => u.role === 'EMPLOYEE').map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })));
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Project title is required.';
    if (!form.client) newErrors.client = 'Please select a client.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setLoading(true);
    try {
      const payload = { ...form, budget: form.budget ? parseFloat(form.budget) : null };
      const res = await createProject(payload);
      toast.success('Project created!');
      navigate(`/organization/projects/${res.data.id}`);
    } catch (err) {
      setErrors(err.response?.data || {});
      toast.error('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Create Project" subtitle="Set up a new project for a client." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Project Title" name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="Website Redesign" required />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief overview of what this project involves..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Client" name="client" value={form.client} onChange={handleChange} options={clients} error={errors.client} required placeholder="Select client" />
            <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
            <Input label="End Date" name="end_date" type="date" value={form.end_date} onChange={handleChange} />
          </div>

          <Input label="Budget ($)" name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="50000" />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Create Project</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/organization/projects')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
