import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';
import { supplierService } from '../../services/supplierService';
import type { Supplier } from '../../types';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setIsLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
      setError('Failed to fetch suppliers list.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingSupplier(null);
    setName('');
    setEmail('');
    setStatus('active');
    setIsModalOpen(true);
  }

  function handleOpenEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setEmail(supplier.email);
    setStatus(supplier.status);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingSupplier) {
        await supplierService.update(editingSupplier._id, { name, email, status });
      } else {
        await supplierService.create({ name, email, status });
      }
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setStatus('active');
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err) {
      console.error('Failed to save supplier:', err);
      alert('Failed to save supplier contact.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await supplierService.delete(id);
      loadSuppliers();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      alert('Failed to remove supplier.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Suppliers</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your supplier directory</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={handleOpenCreate}
        >
          Add Supplier
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card padding="none">
        <CardHeader
          title="All Suppliers"
          subtitle={`${suppliers.length} supplier(s) registered`}
          className="px-5 pt-5 pb-0"
        />
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 flex-shrink-0">
                        {s.name[0]}
                      </div>
                      <span className="font-medium text-neutral-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="text-neutral-500">{s.email}</td>
                  <td>
                    <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="hidden md:table-cell text-neutral-500">{formatDate(s.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                        title="Remove Supplier"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-400 text-sm">
                    No suppliers added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-200 animate-scale-up overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Input
                label="Supplier Name"
                placeholder="e.g. ABC Industrial Supplies"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Contact Email Address"
                type="email"
                placeholder="supplier@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Contact
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
