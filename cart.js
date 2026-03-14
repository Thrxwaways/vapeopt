// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОРЗИНОЙ ==========

// Добавление товара в корзину
function addToCart(product, flavor, category, quantity = 1) {
    // Создаем уникальный ID для товара
    let specString = '';
    if (flavor.strength) specString += `_${flavor.strength}mg`;
    if (flavor.volume) specString += `_${flavor.volume}ml`;
    if (flavor.resistance) specString += `_${flavor.resistance}ohm`;
    
    const itemId = `${product.name}_${flavor.name}${specString}`.replace(/\s+/g, '_');
    
    // Проверяем, есть ли уже такой товар
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: itemId,
            productName: product.name,
            flavorName: flavor.name,
            category: category,
            image: product.image || getCategoryIcon(category),
            price: parseInt(product.price) || 0,
            quantity: quantity,
            specs: {
                strength: flavor.strength || null,
                volume: flavor.volume || null,
                resistance: flavor.resistance || null
            }
        });
    }
    
    saveCart();
    updateCartCounter();
    showNotification('✅ Товар добавлен в корзину');
}

// Получить иконку категории
function getCategoryIcon(category) {
    const icons = {
        'zhidkosti': '💧',
        'rashodniki': '🔧',
        'odnorazki': '⚡',
        'pod-sistemy': '📱',
        'snus': '🍃'
    };
    return icons[category] || '📦';
}

// Сохранить корзину
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Обновить счетчик корзины
function updateCartCounter() {
    const counters = document.querySelectorAll('.cart-counter');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    counters.forEach(counter => {
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Получить общую сумму корзины
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Очистить корзину
function clearCart() {
    cart = [];
    saveCart();
    updateCartCounter();
    if (document.getElementById('cartModal')) {
        renderCartModal();
    }
}

// Удалить товар из корзины
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartCounter();
    if (document.getElementById('cartModal')) {
        renderCartModal();
    }
}

// Изменить количество товара
function updateQuantity(itemId, newQuantity) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartCounter();
            if (document.getElementById('cartModal')) {
                renderCartModal();
            }
        }
    }
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        font-weight: 600;
        z-index: 10001;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 20px rgba(74, 222, 128, 0.4);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАКАЗАМИ ==========

// Оформить заказ
function placeOrder() {
    const telegramInput = document.getElementById('telegramUsername');
    const telegramUsername = telegramInput.value.trim();
    
    if (!telegramUsername) {
        telegramInput.style.border = '2px solid #ff6b6b';
        telegramInput.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        telegramInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showNotification('❌ Заполните Telegram username');
        return false;
    }
    
    if (cart.length === 0) {
        showNotification('❌ Корзина пуста');
        return false;
    }
    
    // Создаем новый заказ
    const order = {
        id: orders.length + 1,
        date: new Date().toLocaleString('ru-RU'),
        telegram: telegramUsername,
        items: [...cart],
        total: getCartTotal()
    };
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Очищаем корзину
    clearCart();
    
    // Закрываем модальное окно
    closeCartModal();
    
    showNotification('✅ Заказ успешно оформлен!');
    
    return true;
}

// Получить все заказы
function getOrders() {
    return orders;
}

// ========== ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ КОРЗИНЫ ==========

// Открыть модальное окно корзины
function openCartModal() {
    let modal = document.getElementById('cartModal');
    
    if (!modal) {
        createCartModal();
        modal = document.getElementById('cartModal');
    }
    
    renderCartModal();
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// Закрыть модальное окно корзины
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Создать модальное окно корзины
function createCartModal() {
    const modalHTML = `
        <div id="cartModal" class="cart-modal">
            <div class="cart-modal-content">
                <div class="cart-modal-header">
                    <h2>🛒 Корзина</h2>
                    <span class="close-cart-modal" onclick="closeCartModal()">✕</span>
                </div>
                
                <div id="cartItemsContainer" class="cart-items-container"></div>
                
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Итого:</span>
                        <span id="cartTotalAmount">0 Br</span>
                    </div>
                    
                    <div class="telegram-input-container">
                        <label for="telegramUsername">Telegram username:</label>
                        <input type="text" id="telegramUsername" placeholder="@username">
                    </div>
                    
                    <button class="checkout-btn" onclick="placeOrder()">✅ Оформить заказ</button>
                    <button class="clear-cart-btn" onclick="clearCart()">🗑️ Очистить корзину</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Добавляем стили для модального окна корзины
    const style = document.createElement('style');
    style.textContent = `
        .cart-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            padding: 15px;
        }
        
        .cart-modal.active {
            display: flex;
        }
        
        .cart-modal-content {
            background: rgba(20, 15, 35, 0.98);
            border: 2px solid rgba(255, 215, 0, 0.2);
            border-radius: 30px;
            padding: 25px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: modalSlideUp 0.4s ease;
        }
        
        .cart-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        }
        
        .cart-modal-header h2 {
            color: transparent;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            background-clip: text;
            -webkit-background-clip: text;
            font-size: 1.8em;
        }
        
        .close-cart-modal {
            color: rgba(255, 255, 255, 0.7);
            font-size: 2em;
            cursor: pointer;
            padding: 5px 15px;
        }
        
        .close-cart-modal:hover {
            color: #ff6b6b;
        }
        
        .cart-items-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 20px;
            max-height: 50vh;
            overflow-y: auto;
            padding-right: 10px;
        }
        
        /* ОСНОВНОЙ КОНТЕЙНЕР ТОВАРА */
        .cart-item {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 215, 0, 0.25);
            border-radius: 20px;
            padding: 12px;
            display: flex;
            gap: 10px;
            position: relative;
            margin-bottom: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        }
        
        .cart-item:hover {
            border-color: rgba(255, 215, 0, 0.6);
            box-shadow: 0 6px 20px rgba(255, 215, 0, 0.2);
            background: rgba(255, 255, 255, 0.08);
        }
        
        /* ФОТО ТОВАРА - слева */
        .cart-item-image {
            width: 70px;
            height: 70px;
            min-width: 70px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2em;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
        }
        
        /* ПРАВАЯ ЧАСТЬ - вся информация */
        .cart-item-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            margin-right: 25px;
        }
        
        /* ВЕРХНЯЯ ЧАСТЬ - название и доп.информация */
        .cart-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }
        
        .cart-item-title-section {
            flex: 1;
            min-width: 0;
        }
        
        .cart-item-title {
            color: white;
            font-weight: 600;
            font-size: 0.95em;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .cart-item-flavor {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.8em;
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* БЛОК С ДОПОЛНИТЕЛЬНОЙ ИНФОРМАЦИЕЙ */
        .cart-item-specs {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            justify-content: flex-end;
            max-width: 120px;
        }
        
        .cart-item-spec {
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 0.65em;
            font-weight: 600;
            box-shadow: 0 0 5px currentColor;
            white-space: nowrap;
        }
        
        .spec-strength {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 140, 0, 0.2));
            border: 1px solid rgba(255, 107, 107, 0.3);
            color: #ff6b6b;
            box-shadow: 0 0 5px rgba(255, 107, 107, 0.3);
        }
        
        .spec-volume {
            background: linear-gradient(135deg, rgba(255, 100, 0, 0.2), rgba(255, 150, 0, 0.2));
            border: 1px solid rgba(255, 150, 0, 0.3);
            color: #ffaa33;
            box-shadow: 0 0 5px rgba(255, 150, 0, 0.3);
        }
        
        .spec-resistance {
            background: linear-gradient(135deg, rgba(255, 0, 150, 0.2), rgba(255, 50, 100, 0.2));
            border: 1px solid rgba(255, 50, 100, 0.3);
            color: #ff6b9d;
            box-shadow: 0 0 5px rgba(255, 50, 100, 0.3);
        }
        
        /* НИЖНЯЯ ЧАСТЬ - количество и цена */
        .cart-item-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2px;
        }
        
        /* БЛОК РЕГУЛИРОВКИ КОЛИЧЕСТВА - ИСПРАВЛЕН */
        .cart-item-quantity {
            display: flex;
            align-items: center;
            background: rgba(255, 215, 0, 0.08);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 25px;
            padding: 0;
            margin-left: -2px;
            overflow: hidden;
        }
        
        .quantity-btn {
            width: 32px;
            height: 28px;
            border: none;
            background: rgba(255, 215, 0, 0.15);
            color: #ffd700;
            font-size: 1.1em;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            margin: 0;
            padding: 0;
            border-radius: 0;
        }
        
        .quantity-btn:first-child {
            border-top-left-radius: 25px;
            border-bottom-left-radius: 25px;
        }
        
        .quantity-btn:last-child {
            border-top-right-radius: 25px;
            border-bottom-right-radius: 25px;
        }
        
        .quantity-btn:hover {
            background: rgba(255, 215, 0, 0.3);
            color: white;
        }
        
        .quantity-btn:active {
            background: rgba(255, 215, 0, 0.5);
            transform: scale(0.95);
        }
        
        .quantity-number-input {
            width: 40px;
            height: 28px;
            padding: 0;
            background: transparent;
            border: none;
            border-left: 1px solid rgba(255, 215, 0, 0.2);
            border-right: 1px solid rgba(255, 215, 0, 0.2);
            color: white;
            text-align: center;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .quantity-number-input:focus {
            outline: none;
            background: rgba(255, 215, 0, 0.1);
        }
        
        /* ЦЕНА ТОВАРА */
        .cart-item-price {
            font-weight: 600;
            color: #ffd700;
            font-size: 1em;
            text-align: right;
            white-space: nowrap;
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
            margin-right: -5px;
            min-width: 55px;
        }
        
        /* КНОПКА УДАЛЕНИЯ */
        .remove-item {
            position: absolute;
            top: 8px;
            right: 8px;
            color: rgba(255, 107, 107, 0.7);
            cursor: pointer;
            font-size: 0.9em;
            padding: 4px;
            transition: all 0.2s ease;
            z-index: 5;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 107, 107, 0.3);
        }
        
        .remove-item:hover {
            color: #ff6b6b;
            transform: scale(1.1);
            background: rgba(0, 0, 0, 0.5);
            border-color: #ff6b6b;
        }
        
        /* ФУТЕР КОРЗИНЫ */
        .cart-footer {
            border-top: 2px solid rgba(255, 215, 0, 0.2);
            padding-top: 20px;
            margin-top: 10px;
        }
        
        .cart-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.2em;
            color: white;
            margin-bottom: 20px;
            padding: 12px 20px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 15px;
            border: 1px solid rgba(255, 215, 0, 0.2);
        }
        
        .cart-total span:last-child {
            color: #ffd700;
            font-weight: 700;
            font-size: 1.3em;
            text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }
        
        .telegram-input-container {
            margin-bottom: 20px;
        }
        
        .telegram-input-container label {
            display: block;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 6px;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        #telegramUsername {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            color: white;
            font-size: 0.95em;
            transition: all 0.3s ease;
        }
        
        #telegramUsername:focus {
            outline: none;
            border-color: #ffd700;
            background: rgba(255, 255, 255, 0.08);
        }
        
        #telegramUsername.error {
            border-color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
        }
        
        .checkout-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 1em;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }
        
        .checkout-btn:hover {
            transform: scale(0.98);
            opacity: 0.9;
            box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
        }
        
        .checkout-btn:active {
            transform: scale(0.95);
        }
        
        .clear-cart-btn {
            width: 100%;
            padding: 12px;
            background: rgba(255, 107, 107, 0.1);
            color: #ff6b6b;
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 30px;
            font-size: 0.95em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .clear-cart-btn:hover {
            background: rgba(255, 107, 107, 0.2);
            border-color: #ff6b6b;
        }
        
        .clear-cart-btn:active {
            transform: scale(0.96);
        }
        
        .empty-cart {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .empty-cart div {
            font-size: 4em;
            margin-bottom: 10px;
            opacity: 0.5;
        }
        
        .empty-cart p {
            font-size: 1.1em;
            font-weight: 400;
        }
        
        @keyframes modalSlideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Отобразить содержимое корзины
function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const totalElement = document.getElementById('cartTotalAmount');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div>🛒</div>
                <p>Корзина пуста</p>
            </div>
        `;
        totalElement.textContent = '0 Br';
        return;
    }
    
    container.innerHTML = cart.map(item => {
        // Формируем строку с характеристиками
        let specsHTML = '';
        if (item.specs.strength) {
            specsHTML += `<span class="cart-item-spec spec-strength">${item.specs.strength} mg</span>`;
        }
        if (item.specs.volume) {
            specsHTML += `<span class="cart-item-spec spec-volume">${item.specs.volume} мл</span>`;
        }
        if (item.specs.resistance) {
            specsHTML += `<span class="cart-item-spec spec-resistance">${item.specs.resistance} Ω</span>`;
        }
        
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">${item.image}</div>
                
                <div class="cart-item-content">
                    <div class="cart-item-header">
                        <div class="cart-item-title-section">
                            <div class="cart-item-title">${item.productName}</div>
                            <div class="cart-item-flavor">${item.flavorName}</div>
                        </div>
                        ${specsHTML ? `<div class="cart-item-specs">${specsHTML}</div>` : ''}
                    </div>
                    
                    <div class="cart-item-footer">
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                            <input type="text" class="quantity-number-input" value="${item.quantity}" onchange="updateQuantityFromInput('${item.id}', this.value)" onkeypress="handleQuantityKeyPress(event, '${item.id}', this)">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        
                        <div class="cart-item-price">${item.price * item.quantity} Br</div>
                    </div>
                </div>
                
                <span class="remove-item" onclick="removeFromCart('${item.id}')">✕</span>
            </div>
        `;
    }).join('');
    
    totalElement.textContent = getCartTotal() + ' Br';
}

// Обработка ручного ввода количества
function updateQuantityFromInput(itemId, value) {
    const newQuantity = parseInt(value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
        updateQuantity(itemId, newQuantity);
    } else {
        // Если введено не число или 0, возвращаем текущее значение
        const item = cart.find(i => i.id === itemId);
        if (item) {
            const input = document.querySelector(`[data-id="${itemId}"] .quantity-number-input`);
            if (input) input.value = item.quantity;
        }
    }
}

// Обработка нажатия Enter в поле ввода количества
function handleQuantityKeyPress(event, itemId, input) {
    if (event.key === 'Enter') {
        event.preventDefault();
        updateQuantityFromInput(itemId, input.value);
        input.blur();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем кнопку корзины на страницу
    const cartButton = document.createElement('div');
    cartButton.className = 'cart-button';
    cartButton.innerHTML = `
        🛒
        <span class="cart-counter" style="display: none;">0</span>
    `;
    cartButton.onclick = openCartModal;
    
    // Стили для кнопки корзины
    const btnStyle = document.createElement('style');
    btnStyle.textContent = `
        .cart-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8em;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
            z-index: 9999;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .cart-button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.6);
        }
        
        .cart-button:active {
            transform: scale(0.95);
        }
        
        .cart-counter {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff6b6b;
            color: white;
            font-size: 0.65em;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 2px solid #0f0c1f;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        
        body.modal-open {
            overflow: hidden;
        }
    `;
    
    document.head.appendChild(btnStyle);
    document.body.appendChild(cartButton);
    
    // Добавляем обработчик клавиши Escape для закрытия модальных окон
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const orderModal = document.getElementById('orderModal');
            if (orderModal && orderModal.classList.contains('active')) {
                if (typeof closeOrderModal === 'function') {
                    closeOrderModal();
                }
            }
            
            const cartModal = document.getElementById('cartModal');
            if (cartModal && cartModal.classList.contains('active')) {
                closeCartModal();
            }
        }
    });
    
    // Добавляем обработчик свайпа вниз для закрытия на телефонах
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        const touchEndY = e.touches[0].clientY;
        const diffY = touchEndY - touchStartY;
        
        if (diffY > 100) {
            const orderModal = document.getElementById('orderModal');
            const cartModal = document.getElementById('cartModal');
            
            if (orderModal && orderModal.classList.contains('active')) {
                if (typeof closeOrderModal === 'function') {
                    closeOrderModal();
                }
            } else if (cartModal && cartModal.classList.contains('active')) {
                closeCartModal();
            }
        }
    }, { passive: true });
    
    // Обновляем счетчик
    updateCartCounter();
});