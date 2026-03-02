import React, { useState } from 'react';
import { db } from '@/api/localDB';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical, Upload, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuTab({ categories, products }) {
    const queryClient = useQueryClient();
    const [productDialog, setProductDialog] = useState(null); // null | 'new' | product obj
    const [categoryDialog, setCategoryDialog] = useState(null); // null | 'new' | category obj
    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Mutations
    const createProduct = useMutation({
        mutationFn: (data) => db.entities.Product.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setProductDialog(null); toast.success('Produit créé'); },
    });
    const updateProduct = useMutation({
        mutationFn: ({ id, data }) => db.entities.Product.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setProductDialog(null); toast.success('Produit modifié'); },
    });
    const deleteProduct = useMutation({
        mutationFn: (id) => db.entities.Product.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit supprimé'); },
    });
    const createCategory = useMutation({
        mutationFn: (data) => db.entities.Category.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCategoryDialog(null); toast.success('Catégorie créée'); },
    });
    const updateCategory = useMutation({
        mutationFn: ({ id, data }) => db.entities.Category.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCategoryDialog(null); toast.success('Catégorie modifiée'); },
    });
    const deleteCategory = useMutation({
        mutationFn: (id) => db.entities.Category.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Catégorie supprimée'); },
    });

    const openProductForm = (product) => {
        if (product === 'new') {
            setFormData({ name: '', description: '', price: '', stock: 0, category_id: categories[0]?.id || '', is_active: true });
            setImagePreview(null);
        } else {
            setFormData(product);
            setImagePreview(product.image_url || null);
        }
        setImageFile(null);
        setProductDialog(product);
    };

    const openCategoryForm = (cat) => {
        if (cat === 'new') {
            setFormData({ name: '', display_order: categories.length });
        } else {
            setFormData(cat);
        }
        setCategoryDialog(cat);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const saveProduct = async () => {
        let image_url = formData.image_url;
        if (imageFile) {
            // Convert image to base64 data URL (local storage)
            image_url = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(imageFile);
            });
        }
        const data = {
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            image_url,
        };
        if (productDialog === 'new') {
            createProduct.mutate(data);
        } else {
            updateProduct.mutate({ id: productDialog.id, data });
        }
    };

    const saveCategory = () => {
        const data = { name: formData.name, display_order: formData.display_order || 0, is_active: true };
        if (categoryDialog === 'new') {
            createCategory.mutate(data);
        } else {
            updateCategory.mutate({ id: categoryDialog.id, data });
        }
    };

    return (
        <div className="space-y-6">
            {/* Categories section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Catégories</h3>
                    <Button size="sm" variant="outline" onClick={() => openCategoryForm('new')} className="rounded-lg">
                        <FolderPlus className="w-4 h-4 mr-1" /> Catégorie
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-1 bg-white border rounded-lg px-3 py-1.5 text-sm group">
                            <GripVertical className="w-3 h-3 text-gray-300" />
                            <span className="font-medium">{cat.name}</span>
                            <button onClick={() => openCategoryForm(cat)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-3 h-3 text-gray-400" />
                            </button>
                            <button onClick={() => deleteCategory.mutate(cat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Products section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Produits</h3>
                    <Button size="sm" onClick={() => openProductForm('new')} className="bg-amber-800 hover:bg-amber-900 rounded-lg">
                        <Plus className="w-4 h-4 mr-1" /> Produit
                    </Button>
                </div>
                <div className="space-y-2">
                    {categories.map(cat => {
                        const catProducts = products.filter(p => p.category_id === cat.id);
                        if (catProducts.length === 0) return null;
                        return (
                            <div key={cat.id}>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat.name}</p>
                                <div className="space-y-1.5">
                                    {catProducts.map(product => (
                                        <div key={product.id} className="bg-white rounded-xl border p-3 flex items-center gap-3 group hover:shadow-sm transition-shadow">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                                                    {!product.is_active && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactif</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {product.price?.toFixed(2)} € · Stock: {product.stock}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openProductForm(product)} className="p-2 rounded-lg hover:bg-gray-100">
                                                    <Pencil className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button onClick={() => deleteProduct.mutate(product.id)} className="p-2 rounded-lg hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Product Dialog */}
            <Dialog open={!!productDialog} onOpenChange={() => setProductDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{productDialog === 'new' ? 'Nouveau Produit' : 'Modifier Produit'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div
                            onDrop={handleImageDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => document.getElementById('product-image')?.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                            ) : (
                                <div className="py-4">
                                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Glisser une image ou cliquer</p>
                                </div>
                            )}
                            <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                        <div>
                            <Label>Nom</Label>
                            <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 h-20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Prix (€)</Label>
                                <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="mt-1" />
                            </div>
                            <div>
                                <Label>Stock</Label>
                                <Input type="number" value={formData.stock || 0} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label>Catégorie</Label>
                            <Select value={formData.category_id || ''} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Actif</Label>
                            <Switch checked={formData.is_active !== false} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProductDialog(null)}>Annuler</Button>
                        <Button onClick={saveProduct} className="bg-amber-800 hover:bg-amber-900">
                            {createProduct.isPending || updateProduct.isPending ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Dialog */}
            <Dialog open={!!categoryDialog} onOpenChange={() => setCategoryDialog(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{categoryDialog === 'new' ? 'Nouvelle Catégorie' : 'Modifier Catégorie'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Nom</Label>
                            <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label>Ordre d'affichage</Label>
                            <Input type="number" value={formData.display_order || 0} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} className="mt-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialog(null)}>Annuler</Button>
                        <Button onClick={saveCategory} className="bg-amber-800 hover:bg-amber-900">Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}