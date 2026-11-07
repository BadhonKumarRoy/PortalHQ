// src/pages/organization/clients/ClientEdit.jsx
// Same form as ClientAdd but pre-fills existing client data for editing.
// URL: /organization/clients/:id/edit

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClient, updateClient } from '../../../api/clients';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    website: '',
    status: 'ACTIVE',
    notes: '',
  });

  // Load existing client data when the page mounts
  useEffect(() => {
    getClient(id)
      .then((res) => {
        const c = res.data;
        setForm({
          contact_name: c.contact_name || c.name || '',
          company_name: c.company_name || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          industry: c.industry || '',
          website: c.website || '',
          status: c.status || 'ACTIVE',
          notes: c.notes || '',
        });
      })
      .catch(() => toast.error('Failed to load client data.'))
      .finally(() => setFetchLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.contact_name) newErrors.contact_name = 'Contact name is required.';
    if (!form.company_name) newErrors.company_name = 'Company name is required.';
    if (!form.email) newErrors.email = 'Email is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      let website = form.website?.trim() || '';
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }

      const payload = {
        ...form,
        website,
        name: form.contact_name?.trim(),
        contact_name: form.contact_name?.trim(),
      };

      await updateClient(id, payload);
      toast.success('Client updated successfully!');
      navigate(`/organization/clients/${id}`);
    } catch (err) {
      const serverErrors = err.response?.data || {};
      if (serverErrors.name && !serverErrors.contact_name) {
        serverErrors.contact_name = Array.isArray(serverErrors.name)
          ? serverErrors.name[0]
          : serverErrors.name;
      }
      setErrors(serverErrors);

      const firstKey = Object.keys(serverErrors)[0];
      const detailMsg =
        serverErrors.detail ||
        (firstKey && Array.isArray(serverErrors[firstKey])
          ? `${firstKey}: ${serverErrors[firstKey][0]}`
          : serverErrors[firstKey]) ||
        'Failed to update client. Check the form for errors.';

      toast.error(detailMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Edit Client" subtitle="Update client information." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} error={errors.contact_name} required />
            <Input label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} error={errors.company_name} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required />
            <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Industry" name="industry" value={form.industry} onChange={handleChange} options={INDUSTRIES} />
            <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} required />
          </div>
          <Input label="Website" name="website" type="url" value={form.website} onChange={handleChange} />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/organization/clients/${id}`)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
