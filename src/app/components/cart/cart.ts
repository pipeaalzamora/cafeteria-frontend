import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { CartItem } from '../../models/cart-item.model';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  total: number = 0;
  customerData = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  increaseQuantity(productId: string): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: string): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: string): void {
    if (confirm('¿Eliminar este producto del carrito?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  clearCart(): void {
    if (confirm('¿Vaciar todo el carrito?')) {
      this.cartService.clearCart();
    }
  }

  checkout(): void {
    if (!this.validateCustomerData()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const order: Order = {
      customerName: this.customerData.name,
      customerEmail: this.customerData.email,
      customerPhone: this.customerData.phone,
      customerAddress: this.customerData.address,
      items: this.cartItems,
      totalAmount: this.total,
      status: OrderStatus.PENDING
    };

    this.orderService.createOrder(order).subscribe({
      next: (createdOrder) => {
        alert('¡Pedido realizado con éxito! Te contactaremos pronto.');
        this.cartService.clearCart();
        this.router.navigate(['/orders']);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        alert('Error al procesar el pedido. Intenta nuevamente.');
      }
    });
  }

  validateCustomerData(): boolean {
    return !!(
      this.customerData.name &&
      this.customerData.email &&
      this.customerData.phone &&
      this.customerData.address
    );
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }
}
