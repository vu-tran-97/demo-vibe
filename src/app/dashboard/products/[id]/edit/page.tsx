'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProductById, updateProduct, CATEGORIES, type Product } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSeller = user?.role === 'SELLER' || user?.role === 'SUPER_ADMIN';
  const isOwnerOrAdmin =
    user &&
    (user.role === 'SUPER_ADMIN' ||
      (user.role === 'SELLER' && product?.seller?.id === user.id));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await fetchProductById(params.id as string);
        setProduct(data);
        setName(data.name);
        setDescription(data.description);
        setPrice(String(data.price));
        setSalePrice(data.salePrice !== null ? String(data.salePrice) : '');
        setCategory(data.category);
        setStock(String(data.stock));
        setImageUrl(data.imageUrl || '');
        setAdditionalImages(data.images?.slice(1) || []);
        setTags(data.tags.join(', '));
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
        <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
        <p>{authLoading ? 'Checking access...' : 'Loading product...'}</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-[8rem] px-[2rem]">
        <h2 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">Error</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">{fetchError}</p>
        <Link href="/dashboard/products" className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-[var(--duration-fast)] hover:text-gold">
          &#8592; Back to Products
        </Link>
      </div>
    );
  }

  if (!isSeller || !isOwnerOrAdmin) {
    return (
      <div className="text-center py-[8rem] px-[2rem]">
        <h2 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">Access Denied</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          You do not have permission to edit this product.
        </p>
        <Link href="/dashboard/products" className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-[var(--duration-fast)] hover:text-gold">
          &#8592; Back to Products
        </Link>
      </div>
    );
  }

  const handleAddImage = () => {
    if (additionalImages.length < 4) {
      setAdditionalImages([...additionalImages, '']);
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const updated = [...additionalImages];
    updated[index] = value;
    setAdditionalImages(updated);
  };

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const parsedPrice = parseFloat(price);
      const parsedSalePrice = salePrice ? parseFloat(salePrice) : null;
      const parsedStock = parseInt(stock, 10);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Please enter a valid price');
      }
      if (parsedSalePrice !== null && (isNaN(parsedSalePrice) || parsedSalePrice <= 0)) {
        throw new Error('Please enter a valid sale price');
      }
      if (isNaN(parsedStock) || parsedStock < 0) {
        throw new Error('Please enter a valid stock quantity');
      }
      if (!category) {
        throw new Error('Please select a category');
      }

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const images = additionalImages.filter((img) => img.trim().length > 0);

      await updateProduct(params.id as string, {
        name,
        description,
        price: parsedPrice,
        salePrice: parsedSalePrice,
        category,
        stock: parsedStock,
        imageUrl: imageUrl || '/products/placeholder.jpg',
        images: images.length > 0 ? images : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      router.push(`/dashboard/products/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[720px] animate-[fadeIn_var(--duration-normal)_var(--ease-out)]">
      <Link href={`/dashboard/products/${params.id}`} className="inline-flex items-center gap-[0.5rem] text-[0.8125rem] text-slate mb-[2rem] transition-colors duration-[var(--duration-fast)] no-underline hover:text-charcoal">
        &#8592; Back to Product
      </Link>

      <h1 className="font-display text-[1.75rem] font-normal text-charcoal mb-[3rem]">Edit Product</h1>

      {error && <div className="py-[1rem] px-[1.5rem] text-[0.875rem] text-error bg-[rgba(196,91,91,0.06)] border border-[rgba(196,91,91,0.15)] rounded-[8px]">{error}</div>}

      <form className="flex flex-col gap-[2rem]" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="name">Product Name</label>
          <input
            id="name"
            type="text"
            className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] resize-y min-h-[120px] leading-[1.6] focus:border-charcoal placeholder:text-muted"
            placeholder="Describe your product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-[1.5rem] max-sm:grid-cols-1">
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="price">Price ($)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="salePrice">Sale Price ($)</label>
            <input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
              placeholder="Optional"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
            <span className="text-[0.75rem] text-muted mt-[2px]">Leave empty for no sale</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[1.5rem] max-sm:grid-cols-1">
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="category">Category</label>
            <select
              id="category"
              className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none cursor-pointer transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="stock">Stock Quantity</label>
            <input
              id="stock"
              type="number"
              min="0"
              className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="imageUrl">Main Image URL</label>
          <input
            id="imageUrl"
            type="url"
            className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]">Additional Images</label>
          <div className="flex flex-col gap-[0.5rem]">
            {additionalImages.map((img, index) => (
              <div key={index} className="flex gap-[0.5rem] items-center">
                <input
                  type="url"
                  className="flex-1 py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
                  placeholder={`Image URL ${index + 2}`}
                  value={img}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className="w-[32px] h-[32px] flex items-center justify-center text-[1rem] text-muted bg-transparent border border-border-light rounded-[4px] cursor-pointer transition-all duration-[var(--duration-fast)] shrink-0 hover:text-error hover:border-error"
                  onClick={() => handleRemoveImage(index)}
                >
                  &#215;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-medium text-slate bg-white border border-dashed border-border rounded-[8px] cursor-pointer transition-all duration-[var(--duration-fast)] self-start hover:border-charcoal hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={handleAddImage}
              disabled={additionalImages.length >= 4}
            >
              + Add Image {additionalImages.length < 4 ? `(${4 - additionalImages.length} remaining)` : ''}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="tags">Tags</label>
          <input
            id="tags"
            type="text"
            className="py-[0.75rem] px-[1rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[var(--duration-fast)] focus:border-charcoal placeholder:text-muted"
            placeholder="ceramic, handmade, pottery"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <span className="text-[0.75rem] text-muted mt-[2px]">Comma-separated</span>
        </div>

        <div className="flex gap-[1rem] pt-[1.5rem] border-t border-border-light max-sm:flex-col">
          <button
            type="submit"
            className="flex-1 py-[0.875rem] px-[2rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:enabled:bg-charcoal-light hover:enabled:-translate-y-[2px] hover:enabled:shadow-[var(--shadow-medium)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/dashboard/products/${params.id}`} className="py-[0.875rem] px-[2rem] font-body text-[0.9375rem] font-medium text-slate bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[var(--duration-fast)] no-underline text-center hover:border-charcoal hover:text-charcoal">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
