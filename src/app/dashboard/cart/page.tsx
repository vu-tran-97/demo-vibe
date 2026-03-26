'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { showToast } from '@/components/toast/Toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } =
    useCart();

  const totalSavings = items.reduce((sum, item) => {
    if (item.product.salePrice !== null) {
      return (
        sum +
        (item.product.price - item.product.salePrice) * item.quantity
      );
    }
    return sum;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-[8rem] px-[2rem]">
        <div className="text-[4rem] mb-[1.5rem] opacity-20">□</div>
        <h2 className="font-display text-[1.75rem] text-charcoal mb-[0.5rem]">Your cart is empty</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          Browse our curated collection and find something you love.
        </p>
        <Link href="/dashboard/products" className="inline-flex items-center py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] transition-all duration-200 hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-[3rem] max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal text-charcoal">Shopping Cart</h2>
          <p className="text-[0.875rem] text-muted mt-[0.25rem]">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" className="font-body text-[0.8125rem] text-error bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-70" onClick={() => { clearCart(); showToast('Cart cleared'); }}>
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-[3rem] items-start max-md:grid-cols-1">
        {/* Cart Items */}
        <div className="flex flex-col gap-[1rem]">
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            return (
              <div key={item.product.id} className="flex gap-[1.5rem] p-[1.5rem] bg-white border border-border-light rounded-[12px] transition-colors duration-200 hover:border-border max-sm:flex-col max-sm:gap-[1rem]">
                <div className="w-[100px] h-[100px] rounded-[8px] bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] shrink-0 overflow-hidden relative max-sm:w-full max-sm:h-[160px]">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-[1rem]">
                    <div>
                      <h3 className="font-display text-[1.125rem] font-medium text-charcoal leading-[1.3]">
                        <Link
                          href={`/dashboard/products/${item.product.id}`}
                          className="text-inherit transition-colors duration-200 hover:text-gold-dark"
                        >
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="text-[0.8125rem] text-muted mt-[2px]">
                        by {item.product.seller.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-[1rem] text-muted bg-transparent border-none cursor-pointer p-[2px] transition-colors duration-200 shrink-0 hover:text-error"
                      onClick={() => {
                        removeItem(item.product.id);
                        showToast(`Removed "${item.product.name}" from cart`);
                      }}
                    >
                      &#x2715;
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-[1rem]">
                    <div className="flex items-center border border-border rounded-[8px] overflow-hidden">
                      <button
                        type="button"
                        className="w-[32px] h-[32px] flex items-center justify-center text-[0.875rem] text-slate bg-white border-none cursor-pointer transition-all duration-200 hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-[36px] text-center text-[0.8125rem] font-medium text-charcoal border-l border-r border-border-light">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="w-[32px] h-[32px] flex items-center justify-center text-[0.875rem] text-slate bg-white border-none cursor-pointer transition-all duration-200 hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    <div>
                      <span className="text-[0.9375rem] font-medium text-charcoal">
                        {formatPrice(price * item.quantity)}
                      </span>
                      {item.product.salePrice !== null && (
                        <span className="text-[0.75rem] text-muted line-through ml-[0.5rem]">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white border border-border-light rounded-[12px] p-[2rem] sticky top-[calc(72px+2rem)] max-md:static">
          <h3 className="font-display text-[1.25rem] font-medium text-charcoal mb-[1.5rem] pb-[1rem] border-b border-border-light">Order Summary</h3>

          <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
            <span className="text-slate">
              Subtotal ({totalItems} items)
            </span>
            <span className="font-medium text-charcoal">
              {formatPrice(totalPrice + totalSavings)}
            </span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
              <span className="text-slate">Discount</span>
              <span className="font-medium text-success">
                −{formatPrice(totalSavings)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
            <span className="text-slate">Shipping</span>
            <span className="font-medium text-charcoal">Free</span>
          </div>

          <div className="h-[1px] bg-border-light my-[1rem]" />

          <div className="flex justify-between items-center py-[1rem]">
            <span className="text-[1rem] font-medium text-charcoal">Total</span>
            <span className="font-display text-[1.5rem] font-medium text-charcoal">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <Link href="/dashboard/checkout" className="block text-center w-full py-[0.875rem] mt-[1.5rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-200 hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-medium">
            Proceed to Checkout
          </Link>

          <Link href="/dashboard/products" className="block text-center mt-[1rem] text-[0.8125rem] text-gold-dark transition-colors duration-200 hover:text-gold">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
