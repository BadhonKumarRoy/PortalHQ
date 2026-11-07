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
import { Users, UserCheck } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
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
    status: 'IN_PROGRESS',
    start_date: '',
    end_date: '',
    budget: '',
    assigned_employees: [],
  });

  // Load clients and employees for the dropdowns
  useEffect(() => {
    getClients()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setClients(data.map((c) => ({ value: c.id, label: c.company_name })));
      })
      .catch(() => {});

    getUsers()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        // Include employees and staff members available to work on projects
        const staffList = data.filter((u) => u.role === 'EMPLOYEE' || u.role === 'ADMIN');
        setEmployees(staffList);

        // Pre-select the default staff member (e.g. employee@portalhq.com) if found
        const defaultEmp = staffList.find((u) => u.email === 'employee@portalhq.com');
        if (defaultEmp) {
          setForm((prev) => ({
            ...prev,
            assigned_employees: [defaultEmp.id],
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Toggle assigned employee
  const toggleEmployee = (empId) => {
    setForm((prev) => {
      const exists = prev.assigned_employees.includes(empId);
      const updated = exists
        ? prev.assigned_employees.filter((id) => id !== empId)
        : [...prev.assigned_employees, empId];
      return { ...prev, assigned_employees: updated };
    });
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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : null,
      };
      const res = await createProject(payload);
      toast.success('Project created and assigned to team!');
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
      <PageHeader
        title="Create Project"
        subtitle="Set up a new project for a client and assign team members."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="e.g. Website Redesign & Portal Modernization"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief overview of what this project involves and team scope..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Client"
              name="client"
              value={form.client}
              onChange={handleChange}
              options={clients}
              error={errors.client}
              required
              placeholder="Select client"
            />
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Assigned Staff / Team Members */}
          <div className="space-y-2 pt-1">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-teal-600" />
              Assign Team Members (Who works on this project)
            </label>
            <p className="text-xs text-slate-500">
              Assigned employees will see this project in their <strong>My Projects</strong> dashboard and can manage tasks and upload deliverables.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {employees.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">Loading staff members...</div>
              ) : (
                employees.map((emp) => {
                  const isAssigned = form.assigned_employees.includes(emp.id);
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isAssigned
                          ? 'border-teal-500 bg-teal-50/50 text-teal-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAssigned
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.full_name ? emp.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">
                            {emp.full_name || emp.email}
                          </p>
                          <p className="text-[10px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                      {isAssigned && (
                        <span className="text-teal-600 text-xs font-bold flex items-center gap-1">
                          <UserCheck size={14} /> Assigned
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="Start Date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
            />
            <Input
              label="End Date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Budget ($)"
            name="budget"
            type="number"
            value={form.budget}
            onChange={handleChange}
            placeholder="50000"
          />

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button type="submit" loading={loading} className="!bg-[#121358]">
              Create Project
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/organization/projects')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
