'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, CATEGORIES } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import styles from '../product-form.module.css';

export default function CreateProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  if (authLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className={styles.accessDenied}>
        <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
        <p className={styles.accessDeniedDesc}>
          Only sellers and administrators can create products.
        </p>
        <Link href="/dashboard/products" className={styles.accessDeniedLink}>
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

      await createProduct({
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

      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard/products" className={styles.backLink}>
        &#8592; Back to Products
      </Link>

      <h1 className={styles.title}>Add New Product</h1>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">Product Name</label>
          <input
            id="name"
            type="text"
            className={styles.input}
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="description">Description</label>
          <textarea
            id="description"
            className={styles.textarea}
            placeholder="Describe your product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="price">Price ($)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className={styles.input}
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="salePrice">Sale Price ($)</label>
            <input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              className={styles.input}
              placeholder="Optional"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
            <span className={styles.hint}>Leave empty for no sale</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="category">Category</label>
            <select
              id="category"
              className={styles.select}
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
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="stock">Stock Quantity</label>
            <input
              id="stock"
              type="number"
              min="0"
              className={styles.input}
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="imageUrl">Main Image URL</label>
          <input
            id="imageUrl"
            type="url"
            className={styles.input}
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Additional Images</label>
          <div className={styles.imageFields}>
            {additionalImages.map((img, index) => (
              <div key={index} className={styles.imageRow}>
                <input
                  type="url"
                  className={styles.input}
                  placeholder={`Image URL ${index + 2}`}
                  value={img}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => handleRemoveImage(index)}
                >
                  &#215;
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addImageBtn}
              onClick={handleAddImage}
              disabled={additionalImages.length >= 4}
            >
              + Add Image {additionalImages.length < 4 ? `(${4 - additionalImages.length} remaining)` : ''}
            </button>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="tags">Tags</label>
          <input
            id="tags"
            type="text"
            className={styles.input}
            placeholder="ceramic, handmade, pottery"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <span className={styles.hint}>Comma-separated</span>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/dashboard/products" className={styles.cancelBtn}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
