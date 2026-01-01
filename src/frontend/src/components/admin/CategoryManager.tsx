import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import type { Category } from '../../types';

interface NewCategory {
    name: string;
    isPromoted: boolean;
}

interface DeleteConfirmState {
    isOpen: boolean;
    id: string | null;
    name: string;
}

const CategoryManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editIsPromoted, setEditIsPromoted] = useState(false);
    const [newCategory, setNewCategory] = useState<NewCategory>({ name: '', isPromoted: false });
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, id: null, name: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;

        setActionLoading(true);
        try {
            await createCategory(newCategory.name, newCategory.isPromoted);
            setNewCategory({ name: '', isPromoted: false });
            setShowAddForm(false);
            fetchCategories();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category._id);
        setEditName(category.name);
        setEditIsPromoted(category.isPromoted || false);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editingId) return;

        setActionLoading(true);
        try {
            await updateCategory(editingId, editName, editIsPromoted);
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (category: Category) => {
        setDeleteConfirm({ isOpen: true, id: category._id, name: category.name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.id) return;
        setActionLoading(true);
        try {
            await deleteCategory(deleteConfirm.id);
            setDeleteConfirm({ isOpen: false, id: null, name: '' });
            fetchCategories();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-lg"></div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Categories</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                </button>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <form onSubmit={handleAdd} className="glass rounded-lg p-4 mb-6 animate-slideUp">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="Category name"
                            className="input-field flex-1"
                        />
                        <label className="flex items-center gap-2 text-white">
                            <input
                                type="checkbox"
                                checked={newCategory.isPromoted}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCategory({ ...newCategory, isPromoted: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            Promoted
                        </label>
                        <div className="flex gap-2">
                            <button type="submit" disabled={actionLoading} className="btn-primary">
                                {actionLoading ? 'Adding...' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Categories Table */}
            <div className="glass rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Promoted</th>
                            <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category._id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    {editingId === category._id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                            className="input-field"
                                        />
                                    ) : (
                                        <span className="text-white">{category.name}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === category._id ? (
                                        <input
                                            type="checkbox"
                                            checked={editIsPromoted}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditIsPromoted(e.target.checked)}
                                            className="w-4 h-4 rounded"
                                        />
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs ${category.isPromoted ? 'bg-green-600/30 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>
                                            {category.isPromoted ? 'Yes' : 'No'}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingId === category._id ? (
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(category)}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categories.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        No categories yet. Add your first category above.
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone and may affect movies in this category.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
                isLoading={actionLoading}
            />
        </div>
    );
};

export default CategoryManager;
