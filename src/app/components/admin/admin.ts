import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { OrderService } from '../../services/order';
import { StatsService } from '../../services/stats';
import { AuthService } from '../../services/auth';
import { Product } from '../../models/product.model';
import { Order, OrderStatus } from '../../models/order.model';
import { DashboardStats } from '../../models/stats.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  activeTab: 'dashboard' | 'products' | 'orders' = 'dashboard';
  products: Product[] = [];
  orders: Order[] = [];
  stats: DashboardStats | null = null;
  editingProduct: Product | null = null;
  newProduct: Product = this.getEmptyProduct();
  uploadingImage: boolean = false;
  selectedFile: File | null = null;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private statsService: StatsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadProducts();
    this.loadOrders();
  }

  loadDashboardStats(): void {
    this.statsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        // Forzar detección de cambios
        setTimeout(() => {}, 0);
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.map(p => ({
          ...p,
          imageUrl: this.getFullImageUrl(p.imageUrl)
        }));
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

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => this.orders = orders,
      error: (error) => console.error('Error loading orders:', error)
    });
  }

  switchTab(tab: 'dashboard' | 'products' | 'orders'): void {
    this.activeTab = tab;
  }

  getEmptyProduct(): Product {
    return {
      id: '',
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      category: 'coffee',
      stock: 0,
      origin: '',
      roastLevel: ''
    };
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return '';
    }

    this.uploadingImage = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    try {
      const response = await fetch('http://localhost:8080/api/upload/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      this.uploadingImage = false;
      
      if (response.ok) {
        return data.url;
      } else {
        alert('Error al subir imagen: ' + data.error);
        return '';
      }
    } catch (error) {
      this.uploadingImage = false;
      alert('Error al subir imagen');
      return '';
    }
  }

  editProduct(product: Product): void {
    this.editingProduct = { ...product };
  }

  saveProduct(): void {
    if (!this.editingProduct) return;

    if (this.editingProduct.id) {
      this.productService.updateProduct(this.editingProduct.id, this.editingProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.editingProduct = null;
          alert('Producto actualizado');
        },
        error: (error) => console.error('Error updating product:', error)
      });
    }
  }

  createProduct(): void {
    if (this.selectedFile) {
      this.uploadImage().then(imageUrl => {
        if (imageUrl) {
          this.newProduct.imageUrl = imageUrl;
        }
        this.saveNewProduct();
      });
    } else {
      this.saveNewProduct();
    }
  }

  private saveNewProduct(): void {
    this.productService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.loadDashboardStats();
        this.newProduct = this.getEmptyProduct();
        this.selectedFile = null;
        alert('Producto creado');
      },
      error: (error) => console.error('Error creating product:', error)
    });
  }

  deleteProduct(id: string): void {
    if (confirm('¿Eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
          this.loadDashboardStats();
          alert('Producto eliminado');
        },
        error: (error) => console.error('Error deleting product:', error)
      });
    }
  }

  updateOrderStatus(orderId: string, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.loadOrders();
        this.loadDashboardStats();
        alert('Estado actualizado');
      },
      error: (error) => console.error('Error updating order status:', error)
    });
  }

  getStatusOptions(): string[] {
    return Object.values(OrderStatus);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
