document.addEventListener('DOMContentLoaded', () => {
    // Загрузка товаров
    async function loadProducts(category = 'all') {
        const productList = document.getElementById('productList');
        productList.innerHTML = '<p>Loading...</p>';
        try {
            const response = await fetch(`http://localhost:5000/api/products?category=${category}`);
            const products = await response.json();
            if (!response.ok) throw new Error(products.error || 'Failed to load products');
            productList.innerHTML = products.map(product => `
                <div class="product-card" data-name="${product.name.toLowerCase()}">
                    <img src="${product.image_url || '/placeholder.jpg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price} DZD</p>
                    <button>Choose options</button>
                </div>
            `).join('');
        } catch (err) {
            productList.innerHTML = `<p style="color: red;">${err.message}</p>`;
            console.error('Error loading products:', err); // Добавим логи для отладки
        }
    }

    // Загрузка категорий для выпадающего списка
    async function loadCategories() {
        const catalogDropdown = document.getElementById('catalogDropdown');
        try {
            const response = await fetch('http://localhost:5000/api/categories');
            const categories = await response.json();
            catalogDropdown.innerHTML = categories.map(cat => `
                <a href="#" data-category="${cat.name}">${cat.name}</a>
            `).join('');
            catalogDropdown.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.getAttribute('data-category');
                    loadProducts(category);
                    catalogDropdown.classList.remove('show');
                });
            });
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }
    loadCategories();

    // Выпадающий список категорий
    const catalogLink = document.getElementById('catalogLink');
    if (catalogLink) {
        catalogLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('catalogDropdown').classList.toggle('show');
        });
    }
    window.addEventListener('click', (e) => {
        if (!e.target.matches('.catalog-link')) {
            const dropdowns = document.getElementsByClassName('dropdown');
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    });

    // Поиск
    const searchQuery = document.getElementById('searchQuery');
    const productList = document.getElementById('productList');

    if (searchQuery) {
        searchQuery.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const productCards = productList.getElementsByClassName('product-card');

            if (!query) {
                // Если запрос пустой, показываем все товары
                for (let card of productCards) {
                    card.style.display = 'block';
                }
                return;
            }

            // Фильтруем товары по названию
            for (let card of productCards) {
                const name = card.getAttribute('data-name');
                if (name && name.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    // Проверка профиля
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                if (confirm('You need to log in. Register or log in now?')) {
                    window.location.href = '/login.html';
                }
            } else {
                window.location.href = '/profile.html';
            }
        });
    }

    // Изначальная загрузка всех товаров
    loadProducts();

    // Существующие обработчики для регистрации, логина, "Забыли пароль" и админ-панели остаются
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData);
            const messageDiv = document.getElementById('message');
            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Registration failed');
                messageDiv.textContent = 'Registration successful!';
                messageDiv.style.color = 'green';
                setTimeout(() => (messageDiv.textContent = ''), 3000);
                registerForm.reset();
            } catch (err) {
                messageDiv.textContent = err.message;
                messageDiv.style.color = 'red';
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData);
            const messageDiv = document.getElementById('message');
            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Login failed');
                messageDiv.textContent = 'Login successful!';
                messageDiv.style.color = 'green';
                setTimeout(() => (messageDiv.textContent = ''), 3000);
                localStorage.setItem('isLoggedIn', 'true');
            } catch (err) {
                messageDiv.textContent = err.message;
                messageDiv.style.color = 'red';
            }
        });
    }

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forgotPasswordForm);
            const data = Object.fromEntries(formData);
            const messageDiv = document.getElementById('message');
            try {
                const response = await fetch('http://localhost:5000/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to send reset link');
                messageDiv.textContent = 'Password reset link sent!';
                messageDiv.style.color = 'green';
                setTimeout(() => (messageDiv.textContent = ''), 3000);
            } catch (err) {
                messageDiv.textContent = err.message;
                messageDiv.style.color = 'red';
            }
        });
    }

    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addCategoryForm);
            const data = Object.fromEntries(formData);
            const adminMessage = document.getElementById('adminMessage');
            try {
                const response = await fetch('http://localhost:5000/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to add category');
                adminMessage.textContent = 'Category added successfully!';
                adminMessage.style.color = 'green';
                setTimeout(() => (adminMessage.textContent = ''), 3000);
                addCategoryForm.reset();
            } catch (err) {
                adminMessage.textContent = err.message;
                adminMessage.style.color = 'red';
            }
        });
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        async function loadCategories() {
            const categorySelect = document.getElementById('productCategory');
            const response = await fetch('http://localhost:5000/api/categories');
            const categories = await response.json();
            categorySelect.innerHTML = '<option value="">Select Category</option>' + categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
        loadCategories();

        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addProductForm);
            const data = Object.fromEntries(formData);
            const adminMessage = document.getElementById('adminMessage');
            try {
                const response = await fetch('http://localhost:5000/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to add product');
                adminMessage.textContent = 'Product added successfully!';
                adminMessage.style.color = 'green';
                setTimeout(() => (adminMessage.textContent = ''), 3000);
                addProductForm.reset();
            } catch (err) {
                adminMessage.textContent = err.message;
                adminMessage.style.color = 'red';
            }
        });
    }
});