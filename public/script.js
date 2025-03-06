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
                <div class="product-card">
                    <img src="${product.image_url || '/placeholder.jpg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price} DZD</p>
                    <button>Choose options</button>
                </div>
            `).join('');
        } catch (err) {
            productList.innerHTML = `<p style="color: red;">${err.message}</p>`;
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
    const searchIcon = document.getElementById('searchIcon');
    const searchInput = document.getElementById('searchInput');
    const searchQuery = document.getElementById('searchQuery');
    const searchResults = document.getElementById('searchResults');

    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            e.preventDefault(); // Предотвращаем стандартное поведение ссылки
            searchInput.classList.toggle('active');
            if (searchInput.classList.contains('active')) {
                searchQuery.focus();
            }
        });
    }

    async function searchProducts(query) {
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/products/search?q=${query}`);
            const products = await response.json();
            if (!response.ok) throw new Error(products.error || 'Search failed');
            const categoriesResponse = await fetch('http://localhost:5000/api/categories');
            const categories = await categoriesResponse.json();
            const results = [
                ...products.map(p => ({ type: 'product', name: p.name, id: p.id })),
                ...categories.map(c => ({ type: 'category', name: c.name, id: c.id }))
            ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
            searchResults.innerHTML = results.map(item => `
                <div data-id="${item.id}" data-type="${item.type}">${item.name} (${item.type})</div>
            `).join('');
            searchResults.querySelectorAll('div').forEach(result => {
                result.addEventListener('click', () => {
                    const type = result.getAttribute('data-type');
                    if (type === 'product') {
                        loadProducts(item.name); // Или перенаправление на страницу товара
                    } else {
                        loadProducts(item.name);
                    }
                    searchInput.classList.remove('active');
                });
            });
        } catch (err) {
            searchResults.innerHTML = `<div style="color: red;">${err.message}</div>`;
        }
    }

    if (searchQuery) {
        searchQuery.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    // Проверка профиля (оставим на потом)
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
                window.location.href = '/profile.html'; // Позже создадим страницу профиля
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