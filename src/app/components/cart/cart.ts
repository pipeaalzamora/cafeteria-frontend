import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { ShippingService } from '../../services/shipping';
import { CartItem } from '../../models/cart-item.model';
import { Order, OrderStatus } from '../../models/order.model';
import { ShippingOption } from '../../models/shipping.model';
import { AddressAutocompleteComponent } from '../address-autocomplete/address-autocomplete';
import { environment } from '../../../environments/environment';

// Peso estimado por unidad (kg) usado para cotizar cuando los productos no
// tienen un peso definido en el catálogo.
const DEFAULT_ITEM_WEIGHT_KG = 0.5;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, AddressAutocompleteComponent],
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

  // Envío
  destinationComuna = '';
  shippingOptions: ShippingOption[] = [];
  selectedShipping: ShippingOption | null = null;
  quoting = false;
  shippingError = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private shippingService: ShippingService,
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
      this.resetShipping();
    }
  }

  decreaseQuantity(productId: string): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
      this.resetShipping();
    }
  }

  removeItem(productId: string): void {
    if (confirm('¿Eliminar este producto del carrito?')) {
      this.cartService.removeFromCart(productId);
      this.resetShipping();
    }
  }

  clearCart(): void {
    if (confirm('¿Vaciar todo el carrito?')) {
      this.cartService.clearCart();
      this.resetShipping();
    }
  }

  // Total de unidades en el carrito.
  get totalItems(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  // Costo de envío de la opción seleccionada (0 si no hay).
  get shippingCost(): number {
    return this.selectedShipping ? this.selectedShipping.price : 0;
  }

  // Total final: subtotal + envío.
  get grandTotal(): number {
    return this.total + this.shippingCost;
  }

  // Cotiza el envío contra el backend (que consulta a los couriers).
  quoteShipping(): void {
    if (!this.destinationComuna.trim()) {
      this.shippingError = 'Ingresa la comuna de destino';
      return;
    }
    if (this.cartItems.length === 0) {
      return;
    }

    this.quoting = true;
    this.shippingError = '';
    this.shippingOptions = [];
    this.selectedShipping = null;

    const weightKg = Math.max(this.totalItems * DEFAULT_ITEM_WEIGHT_KG, DEFAULT_ITEM_WEIGHT_KG);

    this.shippingService
      .quote({
        originComuna: environment.originComuna,
        destinationComuna: this.destinationComuna.trim(),
        weightKg,
        heightCm: 20,
        widthCm: 20,
        lengthCm: 20,
        declaredValue: this.total
      })
      .subscribe({
        next: (res) => {
          this.shippingOptions = res.options ?? [];
          if (this.shippingOptions.length > 0) {
            this.selectedShipping = this.shippingOptions[0];
          } else {
            this.shippingError = 'No hay opciones de envío disponibles';
          }
          this.quoting = false;
        },
        error: (err) => {
          console.error('Error cotizando envío:', err);
          this.shippingError =
            'No se pudo cotizar el envío. Intenta nuevamente o revisa la comuna.';
          this.quoting = false;
        }
      });
  }

  selectShipping(option: ShippingOption): void {
    this.selectedShipping = option;
  }

  private resetShipping(): void {
    this.shippingOptions = [];
    this.selectedShipping = null;
    this.shippingError = '';
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
      shippingCost: this.shippingCost,
      shippingCourier: this.selectedShipping?.courier ?? '',
      shippingService: this.selectedShipping?.service ?? '',
      totalAmount: this.grandTotal,
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
