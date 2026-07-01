import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './products.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategory: string = 'all';
  cartItemCount: number = 0;

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.cartService.getCart().subscribe(() => {
      this.cartItemCount = this.cartService.getItemCount();
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.map(p => ({
          ...p,
          imageUrl: this.getFullImageUrl(p.imageUrl)
        }));
        this.filteredProducts = this.products;
      },
      error: (error) => console.error('Error loading products:', error)
    });
  }

  getFullImageUrl(imageUrl: string): string {
    if (!imageUrl) return '/img/Logo.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads')) {
      return `http://localhost:8080${imageUrl}`;
    }
    return imageUrl;
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    alert(`${product.name} agregado al carrito`);
  }
}
